# Infrastructure (AWS CDK, TypeScript)

Not scaffolded yet. Planned stacks (see docs/02-architecture.md §2, §9, §11):

- `network` — VPC, private subnets, VPC endpoints
- `data` — RDS PostgreSQL 16 (KMS, PITR 35d), ElastiCache Redis, S3 notes bucket (KMS, object lock)
- `compute` — ECS Fargate services: `app`, `api`, `worker`; ALB; CloudFront + WAF
- `email` — SES domain identity, DKIM
- `observability` — CloudWatch dashboards/alarms, X-Ray

Separate AWS accounts for staging and production, both under the AWS BAA.
