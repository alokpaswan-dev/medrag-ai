import os
import base64

from dotenv import load_dotenv

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from groq import Groq


load_dotenv()

vision_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)



INDEX_NAME = "medical-chatbot"

docsearch = PineconeVectorStore.from_existing_index(
    index_name=INDEX_NAME,
    embedding=embeddings
)

retriever = docsearch.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3}
)


llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0
)


system_prompt = (
    "You are a medical information assistant. "
    "Answer the user's question using only the provided context. "
    "If the answer cannot be found in the context, say that "
    "you don't know based on the provided medical book. "
    "Keep the answer concise and clear."
    "\n\n"
    "Context:\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])


def format_docs(docs):
    return "\n\n".join(
        doc.page_content
        for doc in docs
    )

def ask_question(question: str):

    docs = retriever.invoke(question)

    context = format_docs(docs)

    response = (
        prompt
        | llm
        | StrOutputParser()
    ).invoke({
        "context": context,
        "input": question
    })

    sources = []

    for doc in docs:
        sources.append({
            "page": doc.metadata.get("page"),
            "source": doc.metadata.get("source")
        })

    return {
        "answer": response,
        "sources": sources
    }

def analyze_report_image(
    image_data: bytes,
    content_type: str
):

    image_base64 = base64.b64encode(
        image_data
    ).decode("utf-8")

    response = vision_client.chat.completions.create(
        model="qwen/qwen3.8-27b",

        messages=[
            {
                "role": "user",

                "content": [

                    {
                        "type": "text",

                        "text": """
You are a medical report reading assistant.

Carefully read the uploaded medical report.

Extract the information that is clearly visible in the image.

Follow these steps:

1. Identify the type of medical report if possible.

2. Extract:
   - Test name
   - Result/value
   - Unit
   - Reference range

3. Explain each test in simple educational language.

4. Compare the reported value with the reference
   range shown on the report.

5. Clearly mention values that appear outside
   the reference range.

6. Do not invent missing values.

7. If something is blurry or unreadable, say:
   "This value could not be read clearly."

8. Do not diagnose diseases.

9. Do not claim that an abnormal value automatically
   means that the patient has a disease.

Use this format:

REPORT INFORMATION

Test Results:
- Test:
- Result:
- Unit:
- Reference Range:

GENERAL EXPLANATION

Explain the results in simple language.

VALUES OUTSIDE THE SHOWN REFERENCE RANGE

List only values that appear outside the
reference range shown in the report.

IMPORTANT NOTE

Explain that this is an educational interpretation
and should not replace advice from a qualified
healthcare professional.
"""
                    },

                    {
                        "type": "image_url",

                        "image_url": {
                            "url": (
                                f"data:{content_type};base64,"
                                f"{image_base64}"
                            )
                        }
                    }

                ]
            }
        ],

        temperature=0,

        max_completion_tokens=2000
    )

    return response.choices[0].message.content