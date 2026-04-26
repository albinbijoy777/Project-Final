function r(n){const e=String(n??"");return e.includes(",")||e.includes('"')||e.includes(`
`)?`"${e.replaceAll('"','""')}"`:e}function u(n,e){if(!e?.length)return;const c=Object.keys(e[0]),l=[c.join(","),...e.map(i=>c.map(s=>r(i[s])).join(","))].join(`
`),d=new Blob([l],{type:"text/csv;charset=utf-8;"}),o=URL.createObjectURL(d),t=document.createElement("a");t.href=o,t.setAttribute("download",n),document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(o)}export{u as d};
