variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "leap-year-checker"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "website_bucket_name" {
  description = "S3 bucket name for website hosting"
  type        = string
  # 注意: S3バケット名はグローバルに一意である必要があります
  # デプロイ前に変更してください
}
