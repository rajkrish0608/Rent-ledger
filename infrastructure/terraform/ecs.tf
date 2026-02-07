resource "aws_ecs_cluster" "main" {
  name = "rentledger-cluster"
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "rentledger-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "rentledger-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "rentledger-backend:latest" # Will be updated by CI/CD
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "DB_HOST", value = aws_db_instance.postgres.address },
        { name = "DB_PORT", value = "5432" },
        { name = "DB_NAME", value = aws_db_instance.postgres.db_name },
        { name = "DB_USERNAME", value = aws_db_instance.postgres.username },
        { name = "REDIS_HOST", value = aws_elasticache_cluster.redis.cache_nodes[0].address },
        { name = "REDIS_PORT", value = "6379" },
        { name = "AWS_MEDIA_BUCKET", value = aws_s3_bucket.media.id },
        { name = "AWS_EXPORTS_BUCKET", value = aws_s3_bucket.exports.id }
      ]
      secrets = [
        { name = "DB_PASSWORD", valueFrom = "arn:aws:ssm:${var.aws_region}:REPLACE_WITH_ACCOUNT_ID:parameter/rentledger/db_password" },
        { name = "JWT_SECRET", valueFrom = "arn:aws:ssm:${var.aws_region}:REPLACE_WITH_ACCOUNT_ID:parameter/rentledger/jwt_secret" },
        { name = "JWT_REFRESH_SECRET", valueFrom = "arn:aws:ssm:${var.aws_region}:REPLACE_WITH_ACCOUNT_ID:parameter/rentledger/jwt_refresh_secret" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/rentledger-backend"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "rentledger-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_sg.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_cloudwatch_log_group" "backend_logs" {
  name              = "/ecs/rentledger-backend"
  retention_in_days = 7
}
