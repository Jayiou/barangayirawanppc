import{t as e}from"./modulepreload-polyfill-B6nHHmBJ.js";e((()=>{var e=document.getElementById(`preview-root`),t=()=>{e.innerHTML=`
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
    `};t(),(async()=>{n(`Document preview is no longer available.`)})()}))();