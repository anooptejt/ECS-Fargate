# ECS-Fargate

A minimal, production-correct Node.js HTTP service with a complete ECS Fargate delivery pipeline.

## Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── docker-build-push.yml   # CI/CD — build & push to Docker Hub
├── ecs/
│   └── task-definition.json        # ECS Fargate task definition template
├── src/
│   ├── app.js                      # HTTP application
│   └── package.json
├── Dockerfile
└── README.md
```

## Application Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Root — version and hostname |
| `GET /api/health` | Health check (used by ECS) |
| `GET /api/info` | Runtime info (version, memory, Node.js) |

## Local Development

### Build and run with Docker

```bash
# Build
docker build -t anooptejt/ecs-fargate:local .

# Run
docker run -p 8080:8080 anooptejt/ecs-fargate:local

# Test
curl http://localhost:8080/api/health
```

### Run without Docker

```bash
cd src
npm install
node app.js
```

## GitHub Actions — CI/CD Pipeline

File: `.github/workflows/docker-build-push.yml`

**Triggers:**
- Push to `main`
- Git tag push matching `v*.*.*`
- Manual (`workflow_dispatch`)

**Steps:**
1. Checkout with full history (needed for tag resolution)
2. Determine image version (see Versioning below)
3. Set up Docker Buildx with layer cache (GitHub Actions cache)
4. Login to Docker Hub using repository secrets
5. Build and push the image with the appropriate tags

**Required repository secrets:**

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not password) |

Set these at: `https://github.com/<owner>/ECS-Fargate/settings/secrets/actions`

## Versioning Strategy

| Event | Tags pushed |
|---|---|
| Push to `main` | `main-<short_sha>` + `latest` |
| Push to any other branch | `<branch>-<short_sha>` |
| Git tag `v1.2.0` | `v1.2.0` + `latest` |

This ensures every image is traceable to an exact commit while `latest` always points to the most recent stable release from `main` or a semver tag.

```bash
# Create and push a release tag
git tag v1.0.0
git push origin v1.0.0
# → publishes anooptejt/ecs-fargate:v1.0.0 and :latest
```

## ECS Fargate Deployment

### 1. Register the task definition

Edit `ecs/task-definition.json`:
- Replace `<ACCOUNT_ID>` with your AWS account ID
- Update `image` to the desired versioned tag
- Adjust `cpu`/`memory` as needed (256/512 is the minimum)

```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs/task-definition.json \
  --region us-east-1
```

### 2. Create a Fargate service

```bash
aws ecs create-service \
  --cluster <your-cluster> \
  --service-name ecs-fargate-demo \
  --task-definition ecs-fargate-demo \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region us-east-1
```

### 3. Rolling update after a new image push

```bash
aws ecs update-service \
  --cluster <your-cluster> \
  --service ecs-fargate-demo \
  --force-new-deployment \
  --region us-east-1
```

ECS Fargate pulls the new image tag, performs a rolling replacement, and drains the old task once the health check on `/api/health` passes.

### Prerequisites

- ECS cluster with Fargate capacity provider
- `ecsTaskExecutionRole` IAM role with `AmazonECSTaskExecutionRolePolicy`
- CloudWatch log group `/ecs/ecs-fargate-demo`
- VPC with subnets and a security group allowing inbound TCP 8080

## Image on Docker Hub

```
docker pull anooptejt/ecs-fargate:latest
```
