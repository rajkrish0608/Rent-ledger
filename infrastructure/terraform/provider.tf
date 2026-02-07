terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # These should be replaced by your actual bucket and region
    # or passed via -backend-config
    bucket         = "rentledger-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "rentledger-lock-table"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "RentLedger"
      ManagedBy = "Terraform"
      Environment = var.environment
    }
  }
}
