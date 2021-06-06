variable "CLOUDFLARE_ACCOUNT_ID" {
	description = "Your Cloudflare account ID - https://developers.cloudflare.com/workers/quickstart#account-id-and-zone-id"
}

variable "CLOUDFLARE_API_TOKEN" {
	description = "Your Cloudflare API Token - https://dash.cloudflare.com/profile/api-tokens"
}

variable "CLOUDFLARE_ZONE_ID" {
	description = "Your Cloudflare zone ID - https://developers.cloudflare.com/workers/quickstart#account-id-and-zone-id"
}

variable "CLOUDFLARE_HOSTNAME" {
	description = "The hostname associated with your Cloudflare account."
}

provider "cloudflare" {
	account_id = "${var.CLOUDFLARE_ACCOUNT_ID}"
	api_token  = "${var.CLOUDFLARE_API_TOKEN}"
}

resource "cloudflare_workers_kv_namespace" "github-proxy-kv" {
	title = "github-proxy-kv"
}

resource "cloudflare_worker_script" "proxy_script" {
	name    = "sycamore-github-proxy"
	content = file("index.js")

	kv_namespace_binding {
		namespace_id = cloudflare_workers_kv_namespace.github-proxy-kv.id
		name         = "PROXY_KV"
	}
}

# resource "cloudflare_worker_route" "proxy_route" {
#   zone_id     = "${var.CLOUDFLARE_ZONE_ID}"
#   pattern     = "${var.CLOUDFLARE_HOSTNAME}/github-proxy/*"
#   script_name = cloudflare_worker_script.proxy_script.name
# }
