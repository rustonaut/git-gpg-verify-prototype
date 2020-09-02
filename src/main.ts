import * as core from "@actions/core"
import { runAction } from "./action"

process.on("unhandledRejection", (error: any) => {
    console.error("unhandled rejection", error)
    core.setFailed(`Unhandled Rejection: ${error}`)
})

runAction().catch((error: any) => {
    console.error("unhandled exception", error)
    core.setFailed(`Unhandled Exception: ${error}`)
})
