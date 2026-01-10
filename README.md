# Instance Manager

A modern, clean web interface for managing AWS EC2 instances. This application interacts with an n8n backend to perform Start, Stop, and Status check operations on your instances.

<video src="https://github.com/user-attachments/assets/447d8684-e50f-4288-b458-825ed248a7af" controls width="100%" autoplay loop muted></video>

## Features

- **Control Instances**: Power on and off your EC2 instances with a single click.
- **Real-time Status**: View current state (Running, Stopped, Pending) and uptime.
- **Dynamic Management**: Add and remove instance configurations directly from the UI.
- **Activity Log**: Track recent actions and their outcomes.
- **Local Persistence**: Instance configurations are saved locally.
- **Dark Mode**: Supports light and dark themes.

## Deploy with Docker (Recommended)

This is the easiest and recommended way to deploy the application.

1.  **Environment Configuration**:
    Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and add your n8n Webhook URLs. The application will not work without them.

    ```env
    # n8n Webhook URLs
    START_INSTANCE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
    STOP_INSTANCE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
    GET_STATUS_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
    ```

2.  **Run with Docker Compose**:
    ```bash
    docker compose up -d --build
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

    Instance data is stored in the `data/` directory on your host machine, ensuring it persists across container restarts.

## n8n Integration

This frontend requires an n8n workflow to communicate with AWS. The workflow must expose three webhooks for starting, stopping, and getting the status of EC2 instances.

- **Workflow Templates**: You can find example workflows in the `workflows/` directory. Import them into your n8n instance.
- **AWS Credentials**: Ensure your n8n instance has the necessary AWS credentials configured to manage EC2 instances.

## Manual Setup (for Development)

If you prefer to run the application without Docker:

1.  **Prerequisites**:
    - Node.js v18 or later

2.  **Clone and Install**:
    ```bash
    git clone https://github.com/ob1lan/lightweight-ec2-control
    cd lightweight-ec2-control
    npm install
    ```

3.  **Environment Configuration**:
    Follow the same steps as in the Docker deployment to create and configure your `.env` file.

4.  **Run the application**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## License

[MIT](LICENSE)