# Chat Client Frontend

This is the frontend for a chat application built with React. It includes real-time communication using Socket.IO, file uploading capabilities, and uses Auth0 for authentication. Files uploaded through the chat are stored in AWS S3 using presigned URLs. It is built using Vite and deployed to AWS using CodePipeline and CodeBuild.

You can access the live project at [chat-api.link](http://chat-api.link).

Backend Repo: https://github.com/MarceloDJunior/chat-api

## Technologies Used

- React: A JavaScript library for building user interfaces.
- TypeScript: A strict syntactical superset of JavaScript, adding optional static typing.
- SCSS: A preprocessor scripting language that is interpreted or compiled into Cascading Style Sheets (CSS).
- Vite: A build tool that aims to provide a faster and leaner development experience for modern web projects.
- Auth0: A flexible, drop-in solution to add authentication and authorization services to your applications.
- Socket.IO: A JavaScript library for real-time web applications. It enables real-time, bidirectional and event-based communication.
- React Query: A data-fetching and state management library for React applications. It provides essential features for synchronizing, caching, and updating server state in React applications.
- AWS S3: An object storage service that offers industry-leading scalability, data availability, security, and performance. This is used to store files uploaded through the chat.
- AWS CodePipeline & CodeBuild: Fully managed continuous delivery service that helps you automate your release pipelines.
- Framer Motion: A production-ready motion library for React. Used to create animations in the frontend.

## Setup and Installation

To run this project, you will need to have Node.js and npm installed.

1. Clone the repository:

```bash
git clone https://github.com/yourusername/chat-client.git
```

2. Navigate to the project directory:

```bash
cd chat-client
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on the provided `.env.example` and fill in your specific variables.

5. Run the application:

```bash
npm run dev
```

## Deployment

The frontend is automatically deployed to AWS using CodePipeline and CodeBuild. Any changes merged to the main branch will trigger the pipeline, which will build the application and deploy it to AWS.

A `buildspec.yaml` file is included in the repository with the configuration needed for AWS CodeBuild. This file contains a set of build commands and related settings, in YAML format, that CodeBuild uses to run a build.

Please ensure that your AWS credentials are correctly set up and that the AWS environment is properly configured.

## WebSocket Communication

This application uses Socket.IO for real-time, bidirectional and event-based communication. The Socket.IO client is set up to handle incoming messages and send messages to the server.
