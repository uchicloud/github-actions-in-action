output "website_bucket_name" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.id
}

output "website_endpoint" {
  description = "Website endpoint URL"
  value       = aws_s3_bucket_website_configuration.website.website_endpoint
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "full_website_url" {
  description = "Full website URL"
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}

output "full_api_url" {
  description = "Full API URL for leap year checker"
  value       = "${aws_apigatewayv2_api.api.api_endpoint}/api/leap-year"
}
