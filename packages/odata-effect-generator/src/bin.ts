#!/usr/bin/env node

/**
 * CLI entry point for OData Effect Generator.
 *
 * @since 1.0.0
 */
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { cli } from "./Cli.js"

const MainLive = NodeContext.layer

cli(process.argv).pipe(
  Effect.provide(MainLive),
  NodeRuntime.runMain
)
