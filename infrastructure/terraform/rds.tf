resource "aws_db_subnet_group" "db_subnet" {
  name       = "rentledger-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "RentLedger DB Subnet Group"
  }
}

resource "aws_security_group" "db_sg" {
  name        = "rentledger-db-sg"
  description = "Allow inbound postgres traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier           = "rentledger-db"
  allocated_storage     = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  db_name              = "rentledger"
  username             = "rentledger_admin"
  password             = var.db_password
  parameter_group_name = "default.postgres15"
  db_subnet_group_name = aws_db_subnet_group.db_subnet.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot  = true
  publicly_accessible   = false

  tags = {
    Name = "RentLedger-Database"
  }
}
