import os
import tempfile
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from ..services.document_service import DocumentService
from ..auth.auth_service import get_current_user

router = APIRouter(prefix="/api/documents")
document_service = DocumentService()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload and process a document."""
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Process the document
            doc_id = await document_service.process_document(
                tmp_path,
                current_user["id"],
                metadata={"original_name": file.filename}
            )

            return JSONResponse({
                "message": "Document processed successfully",
                "document_id": doc_id
            })
        finally:
            # Clean up the temporary file
            os.unlink(tmp_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_documents(current_user: dict = Depends(get_current_user)):
    """Get all documents for the current user."""
    try:
        documents = await document_service.get_user_documents(current_user["id"])
        return JSONResponse({
            "documents": documents
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a document."""
    try:
        success = await document_service.delete_document(document_id, current_user["id"])
        if success:
            return JSONResponse({
                "message": "Document deleted successfully"
            })
        raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_documents(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """Search through documents using similarity search."""
    try:
        results = await document_service.search_documents(query, current_user["id"])
        return JSONResponse({
            "results": results
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 