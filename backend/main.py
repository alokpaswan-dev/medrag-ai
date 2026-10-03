from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from backend.rag import (
    ask_question,
    analyze_report_image
)


app = FastAPI(
    title="MedRAG AI",
    description="Medical RAG chatbot with medical report analysis",
    version="2.0"
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    question: str


@app.get("/")
def home():

    return {
        "status": "online",
        "message": "MedRAG AI backend is running"
    }


@app.post("/ask")
def ask(request: QuestionRequest):

    if not request.question.strip():

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    try:

        result = ask_question(
            request.question
        )

        return {
            "question": request.question,
            "answer": result["answer"],
            "sources": result["sources"]
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Error processing question: {str(e)}"
        )


@app.post("/analyze-report")
async def analyze_report(
    file: UploadFile = File(...)
):


    if not file.content_type:

        raise HTTPException(
            status_code=400,
            detail="File type could not be detected."
        )



    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/jpg"
    ]


    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG or PNG image."
        )



    image_data = await file.read()



    max_size = 10 * 1024 * 1024


    if len(image_data) > max_size:

        raise HTTPException(
            status_code=400,
            detail="Image is too large. Maximum size is 10 MB."
        )


    if len(image_data) == 0:

        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )


    try:

        analysis = analyze_report_image(
            image_data,
            file.content_type
        )


        return {
            "success": True,

            "filename": file.filename,

            "size": len(image_data),

            "analysis": analysis
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,

            detail=f"Error analyzing medical report: {str(e)}"
        )