document.addEventListener("DOMContentLoaded",()=>{
  const splash=document.getElementById("splash"),
        app=document.getElementById("app"),
        canvas=document.getElementById("editCanvas"),
        ctx=canvas.getContext("2d"),
        upload=document.getElementById("uploadInput"),
        beforeAfter=document.getElementById("beforeAfterBtn"),
        backBtn=document.getElementById("backBtn"),
        exportBtn=document.getElementById("exportBtn"),
        shortcuts=document.querySelectorAll(".shortcut-btn"),
        popup=document.getElementById("tool-popup"),
        popContent=document.getElementById("popup-content"),
        cancelBtn=document.getElementById("cancelBtn"),
        applyBtn=document.getElementById("applyBtn");

  let img=new Image(),
      originalData=null,
      viewingOriginal=false,
      currentFilter="",
      rotation=0,
      flipH=false,
      historyStack=[],
      redoStack=[];

  setTimeout(()=>{
    splash.style.display="none";
    app.classList.remove("hidden");
    resizeCanvas();
  },2500);

  function resizeCanvas(){
    const ctn=document.getElementById("canvas-container");
    canvas.width=ctn.clientWidth;
    canvas.height=ctn.clientHeight;
    drawImage();
  }
  window.addEventListener("resize",resizeCanvas);

  function drawImage(){
    if(!img.src) return;
    ctx.resetTransform();
    ctx.translate(canvas.width/2,canvas.height/2);
    ctx.rotate(rotation*Math.PI/180);
    ctx.scale(flipH?-1:1,1);
    ctx.translate(-canvas.width/2,-canvas.height/2);
    ctx.filter=currentFilter;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const scale=Math.min(canvas.width/img.width,canvas.height/img.height),
          w=img.width*scale, h=img.height*scale;
    ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
    if(!originalData) originalData=ctx.getImageData(0,0,canvas.width,canvas.height);
    ctx.filter="none";
    viewingOriginal=false;
  }

  upload.addEventListener("change",e=>{
    const f=e.target.files[0];
    if(!f) return;
    img.src=URL.createObjectURL(f);
    img.onload=()=>{
      originalData=null;
      historyStack=[];
      redoStack=[];
      currentFilter="";
      rotation=0;
      flipH=false;
      resizeCanvas();
    };
  });

  beforeAfter.addEventListener("click",()=>{
    if(!originalData) return;
    if(viewingOriginal) drawImage();
    else ctx.putImageData(originalData,0,0);
    viewingOriginal=!viewingOriginal;
  });

  backBtn.addEventListener("click",()=>location.reload());

  exportBtn.addEventListener("click",()=>{
    const a=document.createElement("a");
    a.download="moodgrade_edit.png";
    a.href=canvas.toDataURL("image/png");
    a.click();
  });

  document.addEventListener("keydown",e=>{
    if(e.ctrlKey&&e.key==="z"&&historyStack.length){
      redoStack.push(historyStack.pop());
      currentFilter=historyStack[historyStack.length-1]||"";
      drawImage();
    }
    if(e.ctrlKey&&e.key==="y"&&redoStack.length){
      const redo=redoStack.pop();
      historyStack.push(redo);
      currentFilter=redo;
      drawImage();
    }
  });

  const filterDefs={
    "Blade Runner 2049":"contrast(1.3) saturate(1.4) hue-rotate(-10deg)",
    "Oppenheimer":"contrast(1.5) saturate(0.6)",
    "Dune":"brightness(1.1) contrast(1.2) saturate(0.8)",
    "The Batman":"contrast(1.8) brightness(0.9)",
    "La La Land":"hue-rotate(270deg) saturate(1.5)",
    "Joker":"contrast(1.2) sepia(0.2) hue-rotate(80deg)",
    "Mad Max: Fury Road":"sepia(0.3) brightness(1.2) contrast(1.4)",
    "Inception":"contrast(1.3) brightness(0.95) hue-rotate(180deg)",
    "Tenet":"contrast(1.4) brightness(1.05)",
    "Her":"sepia(0.2) brightness(1.1) saturate(1.2)",
    "Moonlight":"hue-rotate(240deg) contrast(1.3)",
    "Parasite":"hue-rotate(100deg) brightness(0.95)",
    "The Grand Budapest Hotel":"hue-rotate(-20deg) saturate(1.4)",
    "Everything Everywhere All at Once":"saturate(1.7) brightness(1.1)",
    "The Revenant":"hue-rotate(10deg) contrast(0.9)",
    "Drive":"hue-rotate(300deg) saturate(1.4)",
    "Interstellar":"brightness(1.1) contrast(0.95)",
    "The Matrix":"hue-rotate(90deg) contrast(1.2)",
    "Nope":"contrast(1.5) saturate(0.7)",
    "Whiplash":"sepia(0.1) contrast(1.3)"
  };

  function openTool(tool){
    popContent.innerHTML="";
    if(tool==="filters"){
      Object.keys(filterDefs).forEach(name=>{
        const btn=document.createElement("button");
        btn.textContent=name;
        btn.addEventListener("click",()=>{
          currentFilter=filterDefs[name];
          drawImage();
        });
        popContent.appendChild(btn);
      });
    }
    if(tool==="adjustments"){
      ["brightness","contrast","saturate","hue-rotate"].forEach(fn=>{
        const label=document.createElement("label");
        label.textContent=fn;
        const inp=document.createElement("input");
        inp.type="range";
        inp.min=0;
        inp.max=fn==="hue-rotate"?360:2;
        inp.step=fn==="hue-rotate"?1:0.01;
        inp.value=fn==="hue-rotate"?0:1;
        inp.addEventListener("input",()=>{
          currentFilter=`${fn}(${inp.value}${fn==="hue-rotate"?"deg":""})`;
          drawImage();
        });
        label.appendChild(inp);
        popContent.appendChild(label);
      });
    }
    if(tool==="rotate"){
      const btn=document.createElement("button");
      btn.textContent="Rotate 90°";
      btn.addEventListener("click",()=>{
        rotation=(rotation+90)%360;
        drawImage();
      });
      popContent.appendChild(btn);
    }
    if(tool==="flip"){
      const btn=document.createElement("button");
      btn.textContent="Flip Horizontal";
      btn.addEventListener("click",()=>{
        flipH=!flipH;
        drawImage();
      });
      popContent.appendChild(btn);
    }
    popup.classList.remove("hidden");
  }

  shortcuts.forEach(btn=>{
    btn.addEventListener("click",()=>openTool(btn.dataset.tool));
  });

  cancelBtn.addEventListener("click",()=>popup.classList.add("hidden"));
  applyBtn.addEventListener("click",()=>{
    historyStack.push(currentFilter);
    redoStack=[];
    popup.classList.add("hidden");
  });
});