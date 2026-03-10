#!/usr/bin/env node

/**
 * CLI entry point for OData Effect Generator.
 *
 * @since 1.0.0
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Effect from "effect/Effect"
import { cli } from "./Cli.js"

cli.pipe(
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain
)
