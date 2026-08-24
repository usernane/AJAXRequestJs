# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for AJAXRequest.js v3.

## What is an ADR?

An ADR is a short document that captures a significant design decision along with its context and consequences. ADRs are numbered sequentially and are immutable once accepted — if a decision is reversed, a new ADR supersedes the old one.

## Template

Use [0000-template.md](0000-template.md) when creating a new ADR.

## V3 Goals

AJAXRequest.js v3 aims to become enterprise-ready while maintaining backward compatibility with v2.x. Key objectives:

1. **Backward Compatibility** — v2 code runs unchanged on v3
2. **Modern JavaScript** — Promises, async/await, ESM modules
3. **Security Hardening** — Input validation, header injection prevention
4. **Enterprise Features** — TypeScript, timeout, cancellation, interceptors
5. **Quality Infrastructure** — Tests, CI/CD, npm publishing

## Index

| # | Title | Status | Date |
|---|-------|--------|------|
| 0001 | [Backward Compatibility Strategy](0001-backward-compatibility.md) | Accepted | 2026-08-19 |
| 0002 | [Promise-Based API with Callback Preservation](0002-promise-api.md) | Accepted | 2026-08-19 |
| 0003 | [ESM/CJS/UMD Module Distribution](0003-module-formats.md) | Accepted | 2026-08-19 |
| 0004 | [TypeScript Definitions](0004-typescript-definitions.md) | Accepted | 2026-08-19 |
| 0005 | [Security Hardening](0005-security-hardening.md) | Accepted | 2026-08-19 |
| 0006 | [Request Timeout and Cancellation](0006-timeout-cancellation.md) | Accepted | 2026-08-19 |
| 0007 | [Global Interceptors](0007-global-interceptors.md) | Accepted | 2026-08-19 |
| 0008 | [Test Infrastructure](0008-test-infrastructure.md) | Accepted | 2026-08-19 |
| 0009 | [Source Code Modularization](0009-source-modularization.md) | Accepted | 2026-08-19 |
| 0010 | [Bug Fixes (removeCall, retry cleanup)](0010-bug-fixes.md) | Accepted | 2026-08-19 |
| 0011 | [Retry Mechanism Redesign](0011-retry-mechanism-redesign.md) | Proposed | 2026-08-25 |
