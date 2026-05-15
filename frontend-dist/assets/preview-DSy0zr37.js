import'data:text/javascript,"assets/preview-DSy0zr37.js";if(!import.meta.resolve)throw Error("import.meta.resolve not supported")';export function __vite_legacy_guard(){import.meta.url,import(`_`).catch(()=>1),(async function*(){})().next()}import{t}from"./modulepreload-polyfill-B6nHHmBJ.js";t((()=>{var e=document.getElementById(`preview-root`),t=()=>{e.innerHTML=`
        <div class="preview-card">
            <div class="spinner" aria-hidden="true"></div>
            <h1 class="preview-title">Preparing document preview</h1>
            <p class="preview-copy">Generating the PDF and opening it here automatically.</p>
        </div>
    `},n=t=>{e.innerHTML=`
        <div class="preview-card">
            <h1 class="preview-title">Unable to open preview</h1>
            <p class="preview-copy">${t}</p>
            <div class="error-box">${t}</div>
        </div>
    `},r=()=>new URLSearchParams(window.location.search).get(`documentId`);t(),(async()=>{let e=r();if(!e){n(`Missing document ID in preview URL.`);return}let t=localStorage.getItem(`barangayToken`)||``;if(!t){n(`Session expired. Please log in again, then try Preview PDF.`);return}try{let n=await fetch(`/api/document-requests/${encodeURIComponent(e)}/preview-document`,{headers:{Authorization:`Bearer ${t}`}});if(!n.ok){let e=null;try{e=await n.json()}catch(e){}let t=e&&(e.message||e.error||String(e))||n.statusText||`Failed to fetch document`;throw Error(t)}let r=await n.blob(),i=window.URL.createObjectURL(r);window.location.replace(i),setTimeout(()=>window.URL.revokeObjectURL(i),6e4)}catch(e){n(e.message||`Failed to load preview.`),console.error(`Preview page error:`,e)}})()}))();