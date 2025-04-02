from typing import List, Optional, Literal, Dict, Any, TypedDict
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, BaseMessage
from langchain_community.utilities import SerpAPIWrapper
from langchain_community.document_loaders import WebBaseLoader
from langchain_experimental.utilities import PythonREPL
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.types import Command
from langchain_core.tools import tool
from pathlib import Path
from tempfile import TemporaryDirectory
import os
import json

# Initialize tools
search = SerpAPIWrapper()
_TEMP_DIRECTORY = TemporaryDirectory()
WORKING_DIRECTORY = Path(_TEMP_DIRECTORY.name)
repl = PythonREPL()

class Router(TypedDict):
    next: str
    reason: str

@tool
def search_web(query: str) -> str:
    """Search the web for information about a topic."""
    try:
        results = search.run(query)
        return results
    except Exception as e:
        return f"Error performing web search: {str(e)}"

@tool
def scrape_webpages(urls: List[str]) -> str:
    """Use requests and bs4 to scrape the provided web pages for detailed information."""
    loader = WebBaseLoader(urls)
    docs = loader.load()
    return "\n\n".join(
        [
            f'<Document name="{doc.metadata.get("title", "")}">\n{doc.page_content}\n</Document>'
            for doc in docs
        ]
    )

@tool
def create_outline(
    points: List[str],
    file_name: str,
) -> str:
    """Create and save an outline."""
    with (WORKING_DIRECTORY / file_name).open("w") as file:
        for i, point in enumerate(points):
            file.write(f"{i + 1}. {point}\n")
    return f"Outline saved to {file_name}"

@tool
def read_document(
    file_name: str,
    start: Optional[int] = None,
    end: Optional[int] = None,
) -> str:
    """Read the specified document."""
    with (WORKING_DIRECTORY / file_name).open("r") as file:
        if start is not None and end is not None:
            lines = file.readlines()[start:end]
        elif start is not None:
            lines = file.readlines()[start:]
        elif end is not None:
            lines = file.readlines()[:end]
        else:
            lines = file.readlines()
        return "".join(lines)

@tool
def write_document(
    content: str,
    file_name: str,
) -> str:
    """Create and save a text document."""
    with (WORKING_DIRECTORY / file_name).open("w") as file:
        file.write(content)
    return f"Document saved to {file_name}"

@tool
def edit_document(
    file_name: str,
    inserts: Dict[int, str],
) -> str:
    """Edit a document by inserting text at specific line numbers."""
    with (WORKING_DIRECTORY / file_name).open("r") as file:
        lines = file.readlines()

    sorted_inserts = sorted(inserts.items())

    for line_number, text in sorted_inserts:
        if 1 <= line_number <= len(lines) + 1:
            lines.insert(line_number - 1, text + "\n")
        else:
            return f"Error: Line number {line_number} is out of range."

    with (WORKING_DIRECTORY / file_name).open("w") as file:
        file.writelines(lines)

    return f"Document edited and saved to {file_name}"

@tool
def python_repl_tool(code: str) -> str:
    """Run Python code in a REPL."""
    try:
        result = repl.run(code)
        return f"Result: {result}"
    except Exception as e:
        return f"Error: {str(e)}"

class State(MessagesState):
    next: str

def make_supervisor_node(llm: BaseChatModel, team_members: List[str]):
    """Create a supervisor node that routes tasks to team members."""
    def supervisor_node(state: State) -> Command[Literal["supervisor"]]:
        messages = state["messages"]
        last_message = messages[-1].content
        current_status = state.get("status", "")
        current_phase = state.get("phase", "research")

        # Check for completion indicators
        if any([
            "completed" in last_message.lower(),
            "final answer" in last_message.lower(),
            "report is ready" in last_message.lower(),
            "task completed" in last_message.lower(),
            "analysis complete" in last_message.lower(),
            "writing complete" in last_message.lower()
        ]):
            # Handle phase transitions
            if current_phase == "research":
                return Command(
                    update={
                        "messages": [
                            *messages,
                            HumanMessage(content="Research phase completed, moving to analysis.", name="supervisor")
                        ],
                        "status": "research_completed",
                        "phase": "analysis"
                    },
                    goto="analyst"
                )
            elif current_phase == "analysis":
                return Command(
                    update={
                        "messages": [
                            *messages,
                            HumanMessage(content="Analysis phase completed, moving to writing.", name="supervisor")
                        ],
                        "status": "analysis_completed",
                        "phase": "writing"
                    },
                    goto="doc_writer"
                )
            elif current_phase == "writing":
                print(f"\n[Supervisor] All phases completed successfully.")
                return Command(
                    update={
                        "messages": [
                            *messages,
                            HumanMessage(content="All phases completed successfully.", name="supervisor")
                        ],
                        "status": "completed"
                    },
                    goto=END
                )

        # Create a structured prompt for the LLM
        prompt = f"""You are a supervisor coordinating a team of {len(team_members)} agents.
        Your task is to analyze the current request and decide which team member should handle it next.
        
        Team members: {', '.join(team_members)}
        Current request: {last_message}
        Current status: {current_status}
        Current phase: {current_phase}
        
        Respond with a JSON object containing:
        1. "next": The name of the team member who should handle this next
        2. "reason": A brief explanation of why you chose this team member
        3. "is_complete": boolean indicating if the task is complete
        """

        print(f"\n[Supervisor] Analyzing request and deciding next steps...")
        # Get the LLM's decision
        response = llm.invoke(prompt)
        decision = json.loads(response.content)
        
        print(f"[Supervisor] Decision: {decision['reason']}")
        
        if decision.get("is_complete", False):
            print("[Supervisor] Task marked as complete.")
            return Command(
                update={
                    "messages": [
                        *messages,
                        HumanMessage(content="Task completed successfully.", name="supervisor")
                    ],
                    "status": "completed"
                },
                goto=END
            )
        
        print(f"[Supervisor] Routing to {decision['next']}")
        return Command(
            update={
                "messages": [
                    *messages,
                    HumanMessage(content=f"Proceeding with {decision['next']}.", name="supervisor")
                ]
            },
            goto=decision["next"]
        )
    
    return supervisor_node

def create_research_team(llm: BaseChatModel):
    """Create a simplified research team focused on gathering key information."""
    from langgraph.prebuilt import create_react_agent

    print("\n[Research Team] Initializing research team...")
    research_agent = create_react_agent(llm, tools=[search_web])

    def research_node(state: State) -> Command[Literal[END]]:
        print("\n[Researcher] Gathering key information...")
        result = research_agent.invoke(state)
        print(f"[Researcher] Research completed: {result['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=result["messages"][-1].content, name="researcher")
                ],
                "status": "research_completed"
            },
            goto=END
        )

    research_builder = StateGraph(State)
    research_builder.add_node("researcher", research_node)
    research_builder.add_edge(START, "researcher")
    return research_builder.compile()

def create_writing_team(llm: BaseChatModel):
    """Create a writing team focused on report generation."""
    from langgraph.prebuilt import create_react_agent

    print("\n[Writing Team] Initializing writing team...")
    writer_agent = create_react_agent(
        llm,
        tools=[create_outline, read_document, write_document, edit_document]
    )

    def writing_node(state: State) -> Command[Literal[END]]:
        print("\n[Writer] Creating report content...")
        result = writer_agent.invoke(state)
        print(f"[Writer] Writing completed: {result['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=result["messages"][-1].content, name="writer")
                ],
                "status": "writing_completed"
            },
            goto=END
        )

    writing_builder = StateGraph(State)
    writing_builder.add_node("writer", writing_node)
    writing_builder.add_edge(START, "writer")
    return writing_builder.compile()

def create_report_generator(llm: BaseChatModel):
    """Create the top-level report generator that orchestrates the process."""
    research_graph = create_research_team(llm)
    writing_graph = create_writing_team(llm)

    def research_phase(state: State) -> Command[Literal["writing_phase"]]:
        print("\n[Report Generator] Starting research phase...")
        response = research_graph.invoke({"messages": state["messages"][-1]})
        return Command(
            update={
                "messages": [
                    HumanMessage(content=response["messages"][-1].content, name="research_phase")
                ],
                "status": "research_completed"
            },
            goto="writing_phase"
        )

    def writing_phase(state: State) -> Command[Literal[END]]:
        print("\n[Report Generator] Starting writing phase...")
        response = writing_graph.invoke({"messages": state["messages"][-1]})
        return Command(
            update={
                "messages": [
                    HumanMessage(content=response["messages"][-1].content, name="writing_phase")
                ],
                "status": "writing_completed"
            },
            goto=END
        )

    report_builder = StateGraph(State)
    report_builder.add_node("research_phase", research_phase)
    report_builder.add_node("writing_phase", writing_phase)
    report_builder.add_edge(START, "research_phase")
    report_builder.add_edge("research_phase", "writing_phase")
    return report_builder.compile() 