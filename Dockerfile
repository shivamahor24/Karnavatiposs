FROM python:3.11-slim

WORKDIR /code

# Copy and install requirements
COPY ./backend/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Set up a new user named "user" with user ID 1000
# (Hugging Face Spaces requires this for security)
RUN useradd -m -u 1000 user

# Switch to the "user" user
USER user

# Set home to the user's home directory
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set the working directory to the user's home directory
WORKDIR $HOME/app

# Copy the backend code into the container, setting the owner to "user"
COPY --chown=user ./backend $HOME/app

# Hugging Face runs web apps on port 7860
EXPOSE 7860

# Command to run the FastAPI server on port 7860
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
