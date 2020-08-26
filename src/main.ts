import * as core from "@actions/core"
import { run_action } from "./action"

process.on("unhandledRejection", (error: any) => {
    console.error("unhandled rejection", error)
    core.setFailed(`Unhandled Rejection: ${error}`)
})

run_action().catch((error: any) => {
    console.error("unhandled exception", error)
    core.setFailed(`Unhandled Exception: ${error}`)
})
