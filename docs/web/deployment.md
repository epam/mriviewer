# Web deployment

## AWS environments

| Environment | URL |
| --- | --- |
| DEV | https://dev.mri-viewer.opensource.epam.com |
| TST / staging | https://tst.mri-viewer.opensource.epam.com |
| PRD | https://mri-viewer.opensource.epam.com |
| Static assets / CDN | https://cdn.mri-viewer.opensource.epam.com |

These canonical domains were verified from the AWS CloudFront console on 2026-10-30.

## Verifying deployments

CloudFront's distribution “Last modified” is the configuration timestamp, not the
application deployment timestamp. Use workflow upload logs, S3 object metadata and
CloudFront invalidation records to check deployments.

## Local AWS configuration

Local AWS account, region, bucket, distribution IDs and console links are recorded in
`.codex/aws-deployment.local.md`. This file is ignored by Git and must not be committed
or force-added.
