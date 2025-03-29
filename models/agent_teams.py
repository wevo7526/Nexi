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

        # Check for completion indicators
        if any([
            "completed" in last_message.lower(),
            "final answer" in last_message.lower(),
            "report is ready" in last_message.lower()
        ]):
            print(f"\n[Supervisor] Task completed successfully.")
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

        # Create a structured prompt for the LLM
        prompt = f"""You are a supervisor coordinating a team of {len(team_members)} agents.
        Your task is to analyze the current request and decide which team member should handle it next.
        
        Team members: {', '.join(team_members)}
        Current request: {last_message}
        
        Respond with a JSON object containing:
        1. "next": The name of the team member who should handle this next
        2. "reason": A brief explanation of why you chose this team member
        3. "is_complete": boolean indicating if the task is complete
        """

        print(f"\n[Supervisor] Analyzing request and deciding next steps...")
        # Get the LLM's decision
        response = llm.invoke(prompt)
        
        try:
            # Parse the response to get the next team member
            decision = json.loads(response.content)
            next_member = decision.get("next")
            is_complete = decision.get("is_complete", False)
            reason = decision.get("reason", "No reason provided")
            
            print(f"[Supervisor] Decision: {reason}")
            
            if is_complete:
                print(f"[Supervisor] Task marked as complete.")
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
            
            if next_member in team_members:
                print(f"[Supervisor] Routing to {next_member}")
                return Command(
                    update={
                        "messages": [
                            *messages[:-1],  # Keep previous messages
                            HumanMessage(content=last_message, name=next_member)
                        ],
                        "status": f"routing_to_{next_member}"
                    },
                    goto=next_member,
                )
            else:
                print(f"[Supervisor] No valid team member found, ending task.")
                return Command(
                    update={
                        "messages": [
                            *messages,
                            HumanMessage(content="I've completed the task.", name="supervisor")
                        ],
                        "status": "completed"
                    },
                    goto=END,
                )
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[Supervisor] Error parsing response: {str(e)}")
            return Command(
                update={
                    "messages": [
                        *messages,
                        HumanMessage(content="I've completed the task.", name="supervisor")
                    ],
                    "status": "error"
                },
                goto=END,
            )

    return supervisor_node

def create_research_team(llm: BaseChatModel):
    """Create the research team that handles information gathering and analysis."""
    from langgraph.prebuilt import create_react_agent

    print("\n[Research Team] Initializing research team...")
    research_agent = create_react_agent(llm, tools=[search_web])
    web_scraper_agent = create_react_agent(llm, tools=[scrape_webpages])
    analysis_agent = create_react_agent(llm, tools=[python_repl_tool])

    def research_node(state: State) -> Command[Literal["supervisor"]]:
        print("\n[Researcher] Starting web search...")
        result = research_agent.invoke(state)
        print(f"[Researcher] Search completed: {result['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=result["messages"][-1].content, name="researcher")
                ],
                "status": "research_completed"
            },
            goto="supervisor",
        )

    def web_scraping_node(state: State) -> Command[Literal["supervisor"]]:
        print("\n[Web Scraper] Starting webpage scraping...")
        result = web_scraper_agent.invoke(state)
        print(f"[Web Scraper] Scraping completed: {result['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=result["messages"][-1].content, name="web_scraper")
                ],
                "status": "scraping_completed"
            },
            goto="supervisor",
        )

    def analysis_node(state: State) -> Command[Literal["supervisor"]]:
        print("\n[Analyst] Starting data analysis...")
        result = analysis_agent.invoke(state)
        print(f"[Analyst] Analysis completed: {result['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=result["messages"][-1].content, name="analyst")
                ],
                "status": "analysis_completed"
            },
            goto="supervisor",
        )

    research_supervisor_node = make_supervisor_node(
        llm, ["researcher", "web_scraper", "analyst"]
    )

    research_builder = StateGraph(State)
    research_builder.add_node("supervisor", research_supervisor_node)
    research_builder.add_node("researcher", research_node)
    research_builder.add_node("web_scraper", web_scraping_node)
    research_builder.add_node("analyst", analysis_node)

    research_builder.add_edge(START, "supervisor")
    return research_builder.compile()

def create_writing_team(llm: BaseChatModel):
    """Create the writing team that handles document creation and editing."""
    from langgraph.prebuilt import create_react_agent

    print("\n[Writing Team] Initializing writing team...")
    doc_writer_agent = create_react_agent(
        llm,
        tools=[create_outline, read_document, write_document, edit_document]
    )
    section_writer_agent = create_react_agent(
        llm,
        tools=[read_document, write_document, edit_document]
    )
    executive_summary_agent = create_react_agent(
        llm,
        tools=[read_document, write_document, edit_document]
    )

    def doc_writing_node(state: State) -> Command[Literal["supervisor"]]:
        print("\n[Document Writer] Starting report structure creation...")
        result = doc_writer_agent.invoke(state)
        print(f"[Document Writer] Report structure created: {result['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=result["messages"][-1].content, name="doc_writer")
                ],
                "status": "document_structure_created"
            },
            goto="supervisor",
        )

    def section_writing_node(state: State) -> Command[Literal["supervisor"]]:
        print("\n[Section Writer] Starting detailed section writing...")
        result = section_writer_agent.invoke(state)
        print(f"[Section Writer] Section completed: {result['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=result["messages"][-1].content, name="section_writer")
                ],
                "status": "section_completed"
            },
            goto="supervisor",
        )

    def executive_summary_node(state: State) -> Command[Literal["supervisor"]]:
        print("\n[Executive Summary Writer] Creating executive summary...")
        result = executive_summary_agent.invoke(state)
        print(f"[Executive Summary Writer] Summary completed: {result['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=result["messages"][-1].content, name="executive_summary_writer")
                ],
                "status": "executive_summary_completed"
            },
            goto="supervisor",
        )

    doc_writing_supervisor_node = make_supervisor_node(
        llm, ["doc_writer", "section_writer", "executive_summary_writer"]
    )

    paper_writing_builder = StateGraph(State)
    paper_writing_builder.add_node("supervisor", doc_writing_supervisor_node)
    paper_writing_builder.add_node("doc_writer", doc_writing_node)
    paper_writing_builder.add_node("section_writer", section_writing_node)
    paper_writing_builder.add_node("executive_summary_writer", executive_summary_node)

    paper_writing_builder.add_edge(START, "supervisor")
    return paper_writing_builder.compile()

def create_report_generator(llm: BaseChatModel):
    """Create the top-level report generator that orchestrates research and writing teams."""
    research_graph = create_research_team(llm)
    writing_graph = create_writing_team(llm)

    teams_supervisor_node = make_supervisor_node(llm, ["research_team", "writing_team"])

    def call_research_team(state: State) -> Command[Literal["supervisor"]]:
        print("\n[Report Generator] Starting research phase...")
        response = research_graph.invoke({"messages": state["messages"][-1]})
        print(f"[Report Generator] Research completed: {response['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=response["messages"][-1].content, name="research_team")
                ],
                "status": "research_completed"
            },
            goto="supervisor",
        )

    def call_writing_team(state: State) -> Command[Literal["supervisor"]]:
        print("\n[Report Generator] Starting writing phase...")
        response = writing_graph.invoke({"messages": state["messages"][-1]})
        print(f"[Report Generator] Writing completed: {response['messages'][-1].content[:100]}...")
        return Command(
            update={
                "messages": [
                    HumanMessage(content=response["messages"][-1].content, name="writing_team")
                ],
                "status": "writing_completed"
            },
            goto="supervisor",
        )

    report_builder = StateGraph(State)
    report_builder.add_node("supervisor", teams_supervisor_node)
    report_builder.add_node("research_team", call_research_team)
    report_builder.add_node("writing_team", call_writing_team)

    report_builder.add_edge(START, "supervisor")
    return report_builder.compile() 