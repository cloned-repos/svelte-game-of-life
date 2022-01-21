# Loading

```svelte
<script context="module">
export async function load({ params, fetch, session, stuff }) {


    //.
    //.
    return {
        status: string
        error: Error
        props: {
            ... data to send back
        }
    }
}
</script>
```

## Input

if `load` returns `{fallthrough: true}` it is like calling `next(...)` in express.

`fetch` differs `from windows.fetch`, It can:

- Access cookies on the server
- it can make request against the app's own endpoints without http call
- make copies of responses when you use it and sends it embedded in the initial page for hydration

- `load` can only apply to `page` and `layout`
- It cannot reference `document` or `windows`
- If `url`, `session` and `stuff` are used in a function (within `load`) they are reactive, and this is also **TRUE** about the **INDIVIDUAL PROPERTIES OF PARAM**, these are reactive aswell

### `url`

- `url: URL`
  - `origin`:
  - `hostname`:
  - `pathname`:
  - `searchParams`:

### `params`

- comes form `url.pathname`

### `fetch`

- equivalent to native web API.

### `session`: extracts a session object from a request objects

By default it is `undefined`, `getSession` (see hooks) populates it

```javascript
export function getSession(request) {
    return request.locals.user 
        ? {
            user: {
                // only include properties needed client-side —
                // exclude anything else attached to the user
                // like access tokens etc
                // bit access tokens in cookies?
                name: request.locals.user.name,
                email: request.locals.user.email,
                avatar: request.locals.user.avatar
            }
        }
  : {}; // if request.locals.user does NOT exist then return empty object
}
```

### `stuff`

Is like a global context it is passed on to deeper nested `page` and `layout` components, the most upper `layout` or `page` component.

If a `page/layout` returns a `stuff` property then it will be
merged when passed down to deeper nested `pages/layouts`.

## Output

`load` returns promise which resolves to an object with the followin props

### `status`

The HTTP status code for the page. If returning an error this:

- error: must be a `4xx` or `5xx` response;
- if returning a redirect it must be a `3xx` response.
- The default is `200`.

### `error`

If something goes wrong during load,
return an `Error` object or a string describing the error alongside a `4xx` or `5xx` status code.

### `redirect`

return string containing the location + also a `status: 3xx` code.

### `maxage` (only for paged components, not layout)

ages maxage in seconds, will create a [`Cache-Control`][cache-control] header.

(what about the other cache (response) directives?, `s-maxage`, `no-cache` etc?)

## Hooks

is one file `src/hooks.js` `src/hooks.ts`, or `src/hooks/index.js`

location of this file is configured in `config.kit.files.hooks`

Exports 4 functions:

- `handle`
- `handleError`
- `getSession`
- `externalFetch`

### handle

- Runs every time svelte receives a request
- Either when app is running or pre-rendering
- you can:
  - `resolve` (invokes sveltekit router and handler(s))
  - allows to modify response headers and bodies
  - or bypass _sveltekit_ entirely (implement your own endpoints).

Request for static assets (also pages that are not pre-rendered are not handled by SvelteKit)

If unimplemented defaults to `({ request, resolve }) => resolve(request)`

You can add custom data to a user request like,

To add custom data to the request, which is passed to endpoints, populate the request.locals object, as shown below.

```javascript
export async function handle({ request, resolve }) {
    request.local.user = await getUserInformation(request.headers.cookie);

    const response = resolve(request); // follow routers etc

    return {
        ...response,
        headers: {
            ...response.headers,
            'x-custom-header': 'potato'
        }
    };

}
```

with `@sveltejs/kit/hooks` can glue multiple handle functions in one.

```javascript
import { sequence } from '@sveltejs/kit/hooks';

export handle = sequence(firstHandle, secondHandle);
```

**QUESTIONS**:

- 1. How would the result of `firstHandle` be passed on to `secondHandle`?
- 2. Would both the `resolve` argument of `firstHandle` and `secondHandle` be merged somehow?

### handleError

will be called, if an error is thrown during rendering (Promise rejects?)

```javascript
export handleError({ error, request }){
    // log error at some "log service"
}
```

> handleError is only called in the case of an uncaught exception. It is not called when pages and endpoints explicitly respond with 4xx and 5xx status codes.

### `getSession`

Creates a session object to be passed to `handle`.
the `getSession` only argument is the `request` object

Default it is: `export function getSession(request){ return {}; }`

### `externalFetch`

Replace/modify a fetch for an external resource (happening inside a components `load` function)

For example front-end component wants to fetch from `http://many.apis.com` but on SSR its better to get it locally from your own system `http://localhost:9800/`

```javascript
export async function externalFetch(request) {
    if (request.url.startsWith('http://many.apis.com')) {
    // clone the original request, but change the URL
    const requestv2 = new Request(
            request.url.replace('http://many.apis.com', 'http://localhost:9800/'),
            request
        );
    }
    return fetch(request);
}
```

## Modules

### `$app/env`

`import { amp, browser, dev, mode, prerendering } from '$app/env';`

- `amp`: the value of `config.kit.amp`
- `browser`: this component is running in the browser
- `dev`: true if in development mode
- `mode`: is the vite mode (`development`) or `production` during build
  - override in `config.kit.mode`
- `prerender`: true when pre-renderinga

### `$app/navigation`

```javascript
import {
    disableScrollHandling, // will prevent svelte from applying it's scroll management (called in onMount for example)
    goto,                  // returns promise, resolves/rejects when sveltekit (fails to) navigate(s) to the passed href
    invalidate,
    prefetch,
    prefetchRoutes,
    beforeNavigate,        // runs whenever navigation is triggered (calling svelte "goto")
    afterNavigate          //runs after component mounts and after navigation
} from '$app/navigation';
```

#### `goto`

Like history api `window.history.go(..)`

```javascript

goto(
        href,
        // second argument is optional
        { 
            replaceState: true, // will replace current history in "history" (default false)
            noscroll: true, // browser will maintain it's scroll position, instead of scrolling to the top
            keepfocus: true, // current focus element will not change, otherwise focus will be reset to body tag
            state: {}, // default {}, the state of the new updated history entry aka
})
```

For `state` property in second argument object see [here][state] and [examples][history-state-example]

### `invalidate`

`invalidate(href)`: causes the `load` to rerun if it access this `href` in a `fetch` function

### `prefetch`

`prefetch(href)`: pre-fetches the svelte page at `href`, equivalent to anchor option `<a sveltekit:prefetch ..>`

_prefetching_ will run the page's `load` function

Returns a promise when the prefetch is complete (or rejects when fails)

### `prefetchRoutes`

`prefetchRoutes(routes)`: pre-fetches all pages that match the `routes` argument

If no argument is given all routes are fetched, otherwise specify _mini-match_

`/about` will match `src/routes/about.svelte`
`/blog` will match `src/routes/blog/[slug].svelte`

Unlike prefetch, this will not call the `load` function of these components

Returns promise that resolves if the `routes` are loaded, (or rejects when fails)

## `$app/paths`

```javascript
import { base, assets } from '$app/paths';
```

### `base`

A relative _root_ string (begins with `/` ) that matches `config.kit.paths.base`
(Or empty if unspecified)

### `assets`

An absolute url that matches `config.kit.paths.assets`
Equal to `base` if not specified in `config.kit.paths.assets`

> Assets path is only created in production build so in _dev_ and _preview_ it is replaced with `/_svelte_kit_assets`

## `$app/stores`

```javascript
import { getStores, navigating, page, session } from '$app/stores';
```

Stores are "contextual" they are added to the context of your root component

This means that `session` and `page` from `$app/stores` are unique to each request request to the server. Safe to include user-specific data in `session`

`getStores`: is utility method wraps around `getContext`

(the getContext in this case returns `{ navigation, page, session }`)

`navigating`: is a readable store, returns either an object `{ from, to }` or `null`.

Since it is a store you can subscribe to changes when navigation starts/ends.

Only has a value:

- `page`: object with current `{ url, params, stuff }` (stuff from server side)

- `session`: is writable store, initial value same as return value of `getSession` (server side).

Ofc changes in client side `session` are not written to server (obviously)

## `$lib`

alias to `src/lib` or whatever is specified in `config.kit.files.lib`

## `$service-worker`

```javascript
import { build, files, timestamp } from '$service-worker';
```

### `$service-worker.build`

Array of url strings representing the files generated by Vite.

### `$service-worker.files`

list of static files in directory `config.kit.files.assets` (defaults to contents of `${projectroot}/static`)

customize what is included from `config.kit.files.assets` by using `config.kit.serviceWorker.files`

### `$service-worker.timestamp`

result of `Date.now()` at build time. (handy for generating unique names for indexDb etc)

## `@sveltejs/kit/hooks`

```javascript
import { sequence } from '@sveltejs/kit/hooks';
```

### `sequence`

A utility function for sequencing `handle` calls.

## Service workers

`src/service-worker.js` or `src/service-worker.ts` or `src/service-worker/index.js`, etc

- build by [**Vite**](https://vitejs.dev/)
- automatically registered by **Vite**
- change location of service worker and disable auto registration in `config` file
- **service worker only work in production build**

Test locally by using `svelte-kit preview`

## Anchor options

### `sveltekit:prefetch`

These are dynamic routes `src/routes/blog/[slug].svelte` svelte uses them for code splitting

```html
<a sveltekit:prefetch href="blog/what-is-sveltekit">What is SvelteKit?</a>
```

This will prefetch `blog/what-is-sveltekit` if you hover with the mouse over it

Prefetch will not work if `router` (page option) is set to false

aka

```svelte
<script context="module">
    export const router = false;
</script>
```

Can also programmaticly invoke prefetch from `$app/navigation`

### `sveltekit:noscroll`

If browser follows link it will put scroll position at (0,0) on new page, svelte mimics behavior
unless `sveltekit:noscroll` is specified.

```html
<a href="path" sveltekit:noscroll>Path</a>
```

### `rel=external`

Sveltekit intercepts clicks on `<a>` bypassing browser and routes using `windows.history` (etc)

if `rel=external` attribute is specified then it goes back to native browser navigation when link is clicked.

## Events

Events on the windows object

- `sveltekit:start`: fired once the app has hydrated
- `sveltekit:navigation-start`: navigation has started
- `sveltekit:navigation-end`: navigation has ended?

## Amp

Set `svelte.config.amp` = `true`|`false` in svelte config;

## ADAPTERS

Workflow:

project → adapter → deployment

### supported environments

Svelte default adapter is `@sveltejs/adapter-auto`

Selects environment automaticly:

`Cloudflare Pages`: `adapter-cloudflare`
`Netlify`: `adapter-netlify`
`Vercel`: `adapter-vercel`

### Nodejs

`@svelteks/adapter-node@next` npm package
update `svelte.config.js`

```javascript
import adapter from '@sveltejs/adapter-node@next';
export default {
    kit: adapter(....)
}
```

### Static sites

Most adapters will generate HTML for pre-render.
If you want to make your app use "pre-renderable"
and generate all pages in your app as static-page.

```javascript
import adapter from '@sveltejs/adapter-static@next';
```

To generate SPA:

- use static adapter
- specify fallback page

```javascript
export default {
    kit: adapter({
        fallback: '200.html'
    })
}
```

### Community adapters

Checkout this [page](https://sveltesociety.dev/components/#adapters)

### Writing custom adapters

Contract of an Adapter

```javascript
export default function(options){
    return {
        name: 'my-adapter',
        async adapt(builder){
            /// implementation  
            //  1. clear out build directory
            //  2. builder.prerender({ test }) to prerender pages
            //
            //  OUTPUT CODE:
            //  3. Imports App from ${builder.getServerDirectory()/app.js}
            //  4. generate manifest file
            //        builder.generateManifest({ relativePath })
            //  5. listen to "requests" and covert them to "SvelteKit Requests" and calls render to generate "SvelteKit Response".
            //  6. shims "fetch" globally 
            //      there is `@sveltejs/kit/install-fetch` helper dat can use "node-fetch"
            //  7. bundle output
            //  8. put user static files + generated in correct location of target platform
        }
    };
}
```

## PAGE OPTIONS

By default Sveltekit will render every on the server then send it to the client and then hydrate it.

### (page) `router`

Disable client side routing for this page

```html
<script context="module">
    export const router = false;
</script>
```

Same as configfile `svelte.config.js` for all pages

`config.kit.router: false`

### (page) `hydrate`

Normally sveltekit hydrates your server-rendered html,

Some pages not need javascript at all (about, blog post)

```html
<script context="module">
    export const hydrate = false;
</script>
```

Same as configfile `svelte.config.js` for all pages

`config.kit.hydrate: false`

> If `hydrate` and `router` are both `false`, SvelteKit will not add any javascript to the page. If also `ssr` is false then there will be no content generation for that page.

### (page) `prerender`

Prerender the html at build time (this is not on "request time").

If the entire app can be pre-rendered consider `adapter-static`

```html
<script context="module">
 export const prerender = true;
</script>
```

#### when not to prerender

If you do need to specify which pages should be accessed by the prerenderer in `config.kit.prerender`. It is an array with entries, see **prerender config section**

Any 2 users hitting a prerender page bust see the same data.

Accessing `page.query` during pre-rendering is forbidden.

#### route conflicts

For example:

- `src/routes/foo/index.js`
- `src/routes/foo/bas.js`

would try to create `foo` and `foo/bar` which is not possible.

Try to create specify files not directories (/index.js)

- `src/routes/foo/index.json.js` -> results in uri `foo.json`
- `src/routes/foo/bar.json.js` -> results in uri `foo/bar.json`

For pages use `foo/index.html` instead of `foo`

## PACKAGING

You can build libraries as well as app.

1. The contents of `src/routes` is the public-facing stuff.
2. `src/lib` contains your app's internal library.

Running `svelte-kit package` ( `npm run package` ).
and generate a `package` directory. (change with `config.package.dir`)

This can be configured in `config.kit.package`

all code in `/src/lib` is packaged, taking into account `exclude/include`.

`package.json` will be copied (and stripped less for the followng fields, if missing they will be added)

- `dependencies`
- `type`
- `exports`

`src/lib/index.js` or/and (yes you can do both) `src/lib/index.svelte` will be treated as the package root

```javascript
import { Foo } from 'my-lib';

import Foo from 'my-lib/Foo.svelte'
```

### Publishing

publish generated package:

```bash
npm publish ./package
```

### Caveats

Oh, this is an experimental feature, all other files (except for `*.ts` or `*.svelte`) are not processed and copied as is.

## COMMAND LINE INTERFACE

### svelte-kit dev

`npx sveltekit dev`

options:

- `-p`/`--port`
- `-o`/`--open` open the browser once the server starts
- `-h`/`--host` — expose the server to the network.
- `-H`/`--https` - launch https server using self-signed cert

### svelte-kit build

`npx sveltekit build`

### svelte-kit preview

`npx sveltekit preview`

options:

- `-p`/`--port`
- `-o`/`--open` open the browser once the server starts
- `-h`/`--host` — expose the server to the network.
- `-H`/`--https` - launch https server using self-signed cert

## CONFIGURATION

all config lives in `svelte.config.js`

```javascript
const config = {
    // options passed to svelte.compile (https://svelte.dev/docs#svelte_compile)
    compilerOptions: null,

    // an array of file extensions that should be treated as Svelte components
    extensions: ['.svelte'],

    kit: {
        adapter: null, // default is @sveltekit/adapter-auto??
        amp: false,
        appDir: '_app',
        files: {
            assets: 'static',
            hooks: 'src/hooks',
            lib: 'src/lib',
            routes: 'src/routes',
            serviceWorker: 'src/service-worker',
            template: 'src/app.html'
        },
        floc: false,
        headers: {
            host: null,
            protocol: null
        },
        host: null,
        //x
        hydrate: true,
        inlineStyleThreshold: 0,
        methodOverride: {
            parameter: '_method',
            allowed: []
        },
        package: {
            dir: 'package',
            emitTypes: true,
            // excludes all .d.ts and files starting with _ as the name
            exports: (filepath) => !/^_|\/_|\.d\.ts$/.test(filepath),
            files: () => true
        },
        paths: {
            assets: '',
            base: ''
        },
        prerender: {
            concurrency: 1,
            crawl: true,
            enabled: true,
            entries: ['*'],
            onError: 'fail'
        },
        protocol: null,
        //x
        router: true,
        serviceWorker: {
            register: true,
            files: (filepath) => !/\.DS_STORE/.test(filepath)
        },
        target: null,
        trailingSlash: 'never',
        vite: () => ({})
    },

    // SvelteKit uses vite-plugin-svelte. Its options can be provided directly here.
    // See the available options at https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md

    // options passed to svelte.preprocess (https://svelte.dev/docs#svelte_preprocess)
    preprocess: null
};

export default config;
```

### `adapter`

required when runninb `svelte-kit build`

### `amp`

creates an amp app

- client side js is disabled
- styles are concatenated into `<style amp-custom>`
- [amp boilerplate](https://amp.dev/boilerplate/) is injected

### `appDir` (default `_app`)

- path relative to `paths.assets`, to service js/css (and IMPORTED assets)
- filenames contain content bashed hashes

### `files`

- `assets`: a place to put static files `favicon.json`
- `hooks`: the location of the hooks module
- `lib`: apps internal library
- `routes`: files that defined the structure of the app
- `serviceWorker`: location of the service worker
- `template`: the location of the template (`src/app.html`) for html responses

### `floc` (default false)

Googles [`floc`](https://github.com/WICG/floc) technology.

### `headers.host` (default null)

take "host" value from another header

```javascript
  header: {
      host: "X-Forwarded-Host" // if you are behind reverse proxy
  }
```

### `headers.protocol` (default null)

take specify original protocol used (behind the proxy)

```javascript
  header: {
      host: "X-Forwarded-Host" // if you are behind reverse proxy
  }
```

### `host` (default null)

Will override `headers.host` (why is this needed)

### `hydrate` (default true)

All pages in the app use client side routing and javascript
Makes a page interactive if true
Some pages do not need js (blog posts)

### `inlineStyleThreshold` (default 0)

All css needed for the page and smaller then the threshold
are inlined into `<style>` block

this will result in fewer calls and improve `First Contentful Paint`.

### `methodOverride.parameter`

Method to use in the query string for passing intended method value (`put`, `delete`, etc).

### `methodOverride.allowed`

Array of allowable http methods that can be used when overriding the original (get/put)

### `package.dir` (default `package`)

directory to put the library npm package

### `package.emitTypes`  (default true)

Emit also `*.d.ts` files.

### `package.exports` 

default: `exports: (filepath) => !/^_|\/_|\.d\.ts$/.test`

Function to return with files are included (merged) in the `package.sjon/exports` field.

### `package.files`

default: `() => true`

typedecl:

```typescript
(filepath: string) => boolean
```

- `false`: Disable router based navigation for the whole app.
- `enable`: (default)

### `paths.assets`

Absolute path where your app's files are served from

### `paths.base`

A root-relative path that must start (but not end) with `/`

This way your app can  live on a "non-root" path

### `prerender.concurrency`

### `prerender.crawl`

Pre-crawl links in `<a>` etc

### `prerender.enabled`

### `prerender.entries`

Array of pages to pre-render

`*` includes all non-dynamic routes (pages with no `[parameters]`)

### `prerender.onError`

Values:

- `'fail'`: "fails" a build when routing error is encountered
- `'continue'`: build to continue after routing error
- `function`: custom handler allowing to log (ci toolchain?), throw (will fail the build)

```javascript
    prerender: {
            onError: ({ status, path, referrer, referenceType }) => {
                // "path" is obvious, what is the rest
            }
    }
```

### `protocol`

- The protocol is assumed to be `https` unless `config.kit.headers.protocol` is set. If necessary, you can override it here.

### `router`

- Enables or disables the client-side router app-wide.

### `serviceWorker.register`

if false disable automatic serviceworker registration

### `serviceWorker.files`

a function `(filepath: string) => boolean` to add the file to `$service-worker.files` array

### `target` (default `document.body`)

target html tag in to template (`app.html`) to mount the app

below `#tag` would be the value to mount the app on `div.#tag`

```html
<body>
    <div id="app"/>
</body>
```

### `trailingSlash`

Whether to remove, append, or ignore trailing slashes when resolving URLs to routes

- `never` - redirect `/x/` to `/x` 
- (choose this, trip it, because you cannot have a directory and real file with the same name in the same parent dir) 
  - `$parent/name` (a real file)
  - `$parent/name/foo` (cannot exist because `$parent/name` is a file already)
- `always` - redirect `/x/` to `/x`
- `ignore` (do not use this)

### `vite` 

Config object for vite (check out vite later)






[cache-control]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
[history-state]: https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
[history-state-example]: https://developer.mozilla.org/en-US/docs/Web/API/History_API#examples
