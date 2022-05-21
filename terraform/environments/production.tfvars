environment              = "production"
project_id               = "amplication"
region                   = "us-east1"
cloud_run_min_replica    = 1
cloud_run_max_replica    = 5
external_blog_server_url = "https://blog-api.amplication.com/graphql"
container_concurrency    = 1000
cpu                      = "4"
memory                   = "2Gi"
cpu_allocation           = "allways"
lb_name                  = "lb-blog"
domain                   = "amplication.com"
neg_name                 = "blog-neg"
domain_public            = "amplication.com"
