variable "GHAPI_CLIENT_ID" {
	description = "GitHub API client ID for your app."
}

variable "GHAPI_CLIENT_SECRET" {
	description = "GitHub API client SECRET for your app."
}

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

# resource "cloudflare_workers_kv_namespace" "github-auth-kv" {
# 	title = "sycamore-github-auth-kv"
# }

# resource "cloudflare_worker_route" "sycamore_auth_route" {
#   zone_id     = "${var.CLOUDFLARE_ZONE_ID}"
#   pattern     = "${var.CLOUDFLARE_HOSTNAME}/github-auth/*"
#   script_name = cloudflare_worker_script.sycamore_auth_route.name
# }

resource "cloudflare_worker_script" "sycamore_auth_route" {
	name    = "sycamore-github-auth"
	content = file("index.js")

	# kv_namespace_binding {
	# 	namespace_id = cloudflare_workers_kv_namespace.github-auth-kv.id
	# 	name         = "AUTH_KV"
	# }

	plain_text_binding {
		name = "GHAPI_CLIENT_ID"
		text = "${var.GHAPI_CLIENT_ID}"
	}

	secret_text_binding {
		name = "GHAPI_CLIENT_SECRET"
		text = "${var.GHAPI_CLIENT_SECRET}"
	}
}

