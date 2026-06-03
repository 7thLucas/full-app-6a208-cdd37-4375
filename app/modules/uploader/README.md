# @qb/uploader

Backend-only module for forwarding uploads to `qb-micro-uploader-platform`.

This module has no UI and no authentication dependency. It owns multer setup, in-memory multipart parsing, calls to the external uploader service, proxy streaming, and uploader request/response types. Other modules should import from `@qb/uploader` instead of configuring multer or calling the external storage service directly.

## What it provides

- **Upload gateway** for image and document files through Express routes.
- **Multer memory storage** for multipart parsing. No uploaded file is written to this app's disk.
- **External storage client** for `qb-micro-uploader-platform`.
- **Public proxy route** for serving stored documents through this app.
- **Client-safe file type helpers**: `FileType` and `MIME_TO_FILE_TYPE`.
- **No auth guard by default**. Apps or workflow modules add auth around the product flow when needed.

## Structure

```
uploader/
|-- index.ts
`-- src/
    |-- controllers/
    |   `-- uploader.controller.ts
    |-- routes/
    |   `-- uploader.routes.ts
    |-- services/
    |   `-- uploader.service.ts
    `-- types/
        `-- uploader.types.ts
```

## Prerequisites

### 1. npm packages

This module owns its upload dependencies:

```bash
npm install axios form-data multer
npm install -D @types/multer
```

When installed as a local package, these are declared in `app/modules/uploader/package.json`.

### 2. External uploader service

Run or configure `qb-micro-uploader-platform`. The module forwards requests to `UPLOADER_SERVER_API`, defaulting to `http://localhost:4000`.

## Environment variables

Copy the contents of `.env.example` into the project root `.env`:

| Variable | Description |
|----------|-------------|
| `_KEYSPACE` | App keyspace sent to the uploader service |
| `_USER_ID` | App/service user ID sent to the uploader service |
| `UPLOADER_SERVER_API` | Base URL for `qb-micro-uploader-platform`; default `http://localhost:4000` |
| `QB_SCAFFOLDER_KEY` | API key sent to the uploader service |

`_KEYSPACE`, `_USER_ID`, and `QB_SCAFFOLDER_KEY` are server-only values. They are injected by the Express backend and are never exposed to the browser.

## Public API

```ts
import {
  uploadFile,
  deleteFile,
  getFile,
  FileType,
  MIME_TO_FILE_TYPE,
} from "@qb/uploader";
import type {
  FileUploadRequest,
  UploaderRequest,
  UploaderResponse,
  UploadType,
} from "@qb/uploader";
```

## API routes

Mounted under `/api` by route auto-discovery:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/uploader/:type` | None by default | Upload one multipart `file`; `type` is `image` or `document` |
| `POST` | `/api/uploader/delete/:filename` | None by default | Delete a stored file by storage filename/id |
| `GET` | `/api/uploader/document/*` | Public | Proxy-stream a stored document from the uploader service |

The built-in routes do not enforce authentication. If an app needs private uploads, guard the product route or workflow layer that uses this uploader.

### Upload response

```json
{
  "success": true,
  "data": {
    "url": "/api/uploader/document/file-id",
    "path": "file-id",
    "originalname": "Brief.pdf",
    "size": 12345,
    "mimeType": "application/pdf"
  }
}
```

The effective max file size is 20MB, enforced by `qb-micro-uploader-platform`.

## Usage from other modules

Use the service API for backend integrations:

```ts
import { uploadFile, FileType, MIME_TO_FILE_TYPE } from "@qb/uploader";
```

For frontend product flows, upload bytes first, then pass the returned metadata to the domain module that owns records. In DocReview, `file-review` performs the second metadata save:

```ts
const form = new FormData();
form.append("file", file);

const uploadResult = await fetch("/api/uploader/document", {
  method: "POST",
  body: form,
}).then((res) => res.json());
```

## Boundaries

- Do not import multer outside this module.
- Do not add authentication dependencies to this module.
- Do not store `uploaded_by` here. Uploader stores bytes only; domain modules store ownership/attribution.
- Do not call `qb-micro-uploader-platform` directly from other modules.
- Use `FileType` from `@qb/uploader` or this package root.
