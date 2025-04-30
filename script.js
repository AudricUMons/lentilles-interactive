const canvas = document.getElementById('rayCanvas');
    const ctx = canvas.getContext('2d');
    const lensType = document.getElementById('lensType');
    const focalInp = document.getElementById('focal');
    const doInp = document.getElementById('do');
    const hoInp = document.getElementById('ho');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resultsDiv = document.getElementById('results');
    const tickIntervalSlider = document.getElementById('tickInterval');
    const tickIntervalValue = document.getElementById('tickIntervalValue');
    let tickIntervalCm = parseInt(tickIntervalSlider.value);

    const BASE_S = 5;            
    

    let panX=0, panY=0, zoom=1;
    let sign, f_phys, do_phys, ho_phys, di_phys, hi_phys;
    let dragging=null, sx=0, sy=0;

    function calculate() {
      sign = lensType.value==='convergente'?1:-1;
      f_phys = parseFloat(focalInp.value)*sign;
      do_phys = parseFloat(doInp.value);
      ho_phys = parseFloat(hoInp.value);
      di_phys = (f_phys*do_phys)/(do_phys-f_phys);
      hi_phys = -di_phys/do_phys*ho_phys;
      const m = hi_phys/ho_phys;
      resultsDiv.innerHTML = `
        <strong>Résultats :</strong><br>
        d₀ = ${do_phys.toFixed(2)} cm<br>
        h₀ = ${ho_phys.toFixed(2)} cm<br>
        dᵢ = ${di_phys.toFixed(2)} cm<br>
        hᵢ = ${hi_phys.toFixed(2)} cm<br>
        Type = ${di_phys>0?'Réelle':'Virtuelle'}<br>
        Orientation = ${m<0?'Renversée':'Droite'}<br>
        m = ${m.toFixed(2)}<br>
        D = ${(1/f_phys).toFixed(2)} D
      `;
    }

    function draw() {
      const CX = canvas.width / 2;
      const CY = canvas.height / 2;
      const w=canvas.width, h=canvas.height;
      const S=BASE_S*zoom;
      const baseFontSize = 10; // taille de départ
      const minFontSize = 9;
      const maxFontSize = baseFontSize;
      const currentFontSize = Math.max(minFontSize, Math.min(maxFontSize, baseFontSize / zoom));
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = "#ffffff"; // ou autre couleur de fond
      ctx.fillRect(0, 0, w, h);


      // axes ticks every 2cm with labels
      const tickPx = tickIntervalCm * S;
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
      ctx.fillStyle = '#000'; ctx.font = `${currentFontSize}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      // positive X direction
      for (let x = CX + panX; x <= w; x += tickPx) {
        ctx.beginPath(); ctx.moveTo(x, CY + panY - 5); ctx.lineTo(x, CY + panY + 5); ctx.stroke();
        const wx = (x - (CX + panX)) / S;
        ctx.fillText(wx.toFixed(0), x, CY + panY + 6);
      }
      // negative X direction
      for (let x = CX + panX - tickPx; x >= 0; x -= tickPx) {
        ctx.beginPath(); ctx.moveTo(x, CY + panY - 5); ctx.lineTo(x, CY + panY + 5); ctx.stroke();
        const wx = (x - (CX + panX)) / S;
        ctx.fillText(wx.toFixed(0), x, CY + panY + 6);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      // positive Y direction
      for (let y = CY + panY; y <= h; y += tickPx) {
        ctx.beginPath(); ctx.moveTo(CX + panX - 5, y); ctx.lineTo(CX + panX + 5, y); ctx.stroke();
        const wy = (CY + panY - y) / S;
        ctx.fillText(wy.toFixed(0), CX + panX - 6, y);
      }
      // negative Y direction
      for (let y = CY + panY - tickPx; y >= 0; y -= tickPx) {
        ctx.beginPath(); ctx.moveTo(CX + panX - 5, y); ctx.lineTo(CX + panX + 5, y); ctx.stroke();
        const wy = (CY + panY - y) / S;
        ctx.fillText(wy.toFixed(0), CX + panX - 6, y);
      }
      // axes lines
      ctx.strokeStyle='#333'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(CX+panX,0); ctx.lineTo(CX+panX,h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,CY+panY); ctx.lineTo(w,CY+panY); ctx.stroke();

      // optics in world coords
      ctx.save();
      ctx.translate(CX+panX,CY+panY);
      ctx.scale(1,-1);

      // lens
      ctx.strokeStyle='#000'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(0,-80*zoom); ctx.lineTo(0,80*zoom); ctx.stroke();

      const f_px = Math.abs(f_phys)*S;
      const ox = -do_phys*S, oy=ho_phys*S;
      const ix = di_phys*S, iy=hi_phys*S;

      // focus points
      ctx.fillStyle='black';
      
      ctx.beginPath(); ctx.arc(sign*f_px,0,2*zoom,0,2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(-sign*f_px,0,2*zoom,0,2*Math.PI); ctx.fill();

      // F labels
      ctx.scale(1,-1);
      ctx.fillStyle='black'; ctx.font=`${16}px sans-serif`;
      ctx.fillText("F'", sign*f_px+6*zoom, -6*zoom);
      ctx.fillText("F", -sign*f_px-6*zoom, -6*zoom);
      ctx.scale(1,-1);

      // object & image
      ctx.fillStyle='blue'; ctx.beginPath(); ctx.arc(ox,oy,2*zoom,0,2*Math.PI); ctx.fill();
      ctx.fillStyle='red';  ctx.beginPath(); ctx.arc(ix,iy,2*zoom,0,2*Math.PI); ctx.fill();

      // R1
      ctx.strokeStyle='orange'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(0, oy);
      const vx = sign * f_px;
      const vy = -oy;
      const t1 = (w/2) / vx;
      ctx.lineTo(vx * t1, oy + vy * t1);
      ctx.stroke();

      // R2
      ctx.strokeStyle='green'; ctx.lineWidth=2;
      ctx.beginPath();
      const focalX = -sign * f_px;
      const focalY = 0;
      const yLens = oy + ((0 - ox) * (focalY - oy)) / (focalX - ox);
      ctx.moveTo(ox, oy);
      ctx.lineTo(0, yLens);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, yLens); ctx.lineTo(w/2, yLens); ctx.stroke();

      // R3
      ctx.strokeStyle='purple'; ctx.lineWidth=2;
      const dx = -ox, dy = -oy;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(0, 0);
      const t2b = (w/2) / dx;
      ctx.lineTo(dx * t2b, dy * t2b);
      ctx.stroke();

      ctx.restore();
    }

    tickIntervalSlider.addEventListener('input', () => {
      tickIntervalCm = parseInt(tickIntervalSlider.value);
      tickIntervalValue.textContent = tickIntervalCm;
      draw();
    });
    
    canvas.addEventListener('mousedown',e=>{ dragging='pan'; sx=e.clientX; sy=e.clientY; });
    canvas.addEventListener('mousemove',e=>{
      if(!dragging) return;
      panX += e.clientX - sx;
      panY += e.clientY - sy;
      sx=e.clientX; sy=e.clientY;
      draw();
    });
    ['mouseup','mouseleave'].forEach(ev=>canvas.addEventListener(ev,()=>dragging=null));
    canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        dragging = 'pan';
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
      }
    });
    
    canvas.addEventListener('touchmove', e => {
      if (dragging !== 'pan') return;
      const touch = e.touches[0];
      panX += touch.clientX - sx;
      panY += touch.clientY - sy;
      sx = touch.clientX;
      sy = touch.clientY;
      draw();
      e.preventDefault(); // évite le scroll de la page
    }, { passive: false });
    
    canvas.addEventListener('touchend', () => {
      dragging = null;
    });
    

    [lensType,focalInp,doInp,hoInp].forEach(el=>el.addEventListener('input',()=>{ calculate(); draw(); }));
    zoomInBtn.addEventListener('click', () => {
      if (zoom < 5) { // Set a maximum zoom level
      zoom *= 1.2;
      draw();
      }
    });

    zoomOutBtn.addEventListener('click', () => {
      if (zoom > 0.2) { // Set a minimum zoom level
      zoom /= 1.2;
      draw();
      }
    });

    function resizeCanvasIfMobile() {
      const isMobile = window.innerWidth < 768;
      const width = isMobile ? window.innerWidth - 30 : 1600;
      const height = isMobile ? Math.floor(width / 2) : 800;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        draw();
      }
    }

    window.addEventListener('resize', resizeCanvasIfMobile);


    document.getElementById('exportBtn').addEventListener('click', () => {
      html2canvas(document.getElementById('canvasContainer')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'graphique_complet.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    });
    
    

    // init
    calculate();
    draw();
    resizeCanvasIfMobile();
