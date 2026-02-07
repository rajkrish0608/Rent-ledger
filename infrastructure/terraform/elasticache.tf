resource "aws_elasticache_subnet_group" "redis_subnet" {
  name       = "rentledger-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "redis_sg" {
  name        = "rentledger-redis-sg"
  description = "Allow inbound redis traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "rentledger-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet.name
  security_group_ids   = [aws_security_group.redis_sg.id]

  tags = {
    Name = "RentLedger-Redis"
  }
}
