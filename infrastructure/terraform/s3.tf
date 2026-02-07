resource "aws_s3_bucket" "media" {
  bucket = "rentledger-media-${var.environment}"

  tags = {
    Name = "RentLedger Media Storage"
  }
}

resource "aws_s3_bucket" "exports" {
  bucket = "rentledger-exports-${var.environment}"

  tags = {
    Name = "RentLedger Exports Storage"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "exports_lifecycle" {
  bucket = aws_s3_bucket.exports.id

  rule {
    id     = "expire-exports"
    status = "Enabled"

    expiration {
      days = 1 # Exports expire after 1 day as per requirement
    }
  }
}

resource "aws_s3_bucket_public_access_block" "media_block" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "exports_block" {
  bucket = aws_s3_bucket.exports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
