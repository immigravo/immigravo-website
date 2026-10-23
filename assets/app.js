/* Immigravo — shared behaviour. Every feature checks that its elements exist on the current page. */
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const store = {
    get(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } },
    set(k,v){ try{ sessionStorage.setItem(k,v); }catch(e){} }
  };

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav-toggle'), menu = $('#mobile-menu');
  if(toggle && menu){
    toggle.addEventListener('click', ()=>{
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Visa type switch ---------- */
  const switchBtns = $$('.path-switch button');
  if(switchBtns.length){
    const show = path => {
      switchBtns.forEach(b=>{
        const on = b.dataset.path === path;
        b.classList.toggle('active', on); b.setAttribute('aria-selected', on ? 'true':'false');
      });
      $('#visa-grid-immigrant').style.display = path==='immigrant' ? 'grid':'none';
      $('#visa-grid-nonimmigrant').style.display = path==='nonimmigrant' ? 'grid':'none';
    };
    switchBtns.forEach(b=>b.addEventListener('click', ()=>show(b.dataset.path)));
    if(location.hash === '#nonimmigrant') show('nonimmigrant');
  }

  /* ---------- Eligibility questionnaire ---------- */
  if($('.quiz-shell')){
    const state = {step:0, goal:null, location:null, sponsor:null, timing:null};
    const groups = ['goal','location','sponsor','timing'];
    const total = groups.length;
    const next = $('#quiz-next'), back = $('#quiz-back');

    $$('.opt-list').forEach(list=>{
      list.addEventListener('change', e=>{
        state[list.dataset.group] = e.target.value;
        $$('.opt', list).forEach(o=>o.classList.remove('selected'));
        e.target.closest('.opt').classList.add('selected');
        next.disabled = false;
      });
    });

    const render = () => {
      $$('.quiz-step').forEach(s=>s.classList.remove('active'));
      $('.quiz-step[data-step="'+state.step+'"]').classList.add('active');
      $$('.dot-ind').forEach(d=>{
        const i = +d.dataset.i; d.classList.remove('on','past');
        if(i < state.step) d.classList.add('past');
        if(i === state.step) d.classList.add('on');
      });
      back.disabled = state.step === 0;
      if(state.step >= total){
        $('#quiz-actions').style.display = 'none';
        $('#quiz-step-label').textContent = 'Result';
        result();
      } else {
        $('#quiz-actions').style.display = 'flex';
        $('#quiz-step-label').textContent = 'Question '+(state.step+1)+' of '+total;
        next.disabled = !state[groups[state.step]];
        next.textContent = state.step === total-1 ? 'See my result' : 'Next question';
      }
    };

    const result = () => {
      const {goal, location, sponsor, timing} = state;
      let code, text, visaKey;
      if(goal==='family'){
        code = sponsor==='yes' ? 'IR / CR visa' : 'F1–F4 family preference';
        visaKey = 'Family-based green card';
        text = sponsor==='yes'
          ? 'With a qualifying U.S. relative ready to sponsor you, an immediate-relative or spousal green card is usually the fastest family route.'
          : 'Without a confirmed sponsor yet, family-preference categories are the likely fit once a qualifying U.S. citizen or green card holder relative can file for you.';
      } else if(goal==='work'){
        visaKey = sponsor==='yes' && timing==='urgent' ? 'H-1B / work visa' : 'Employment-based green card';
        code = sponsor==='yes' ? (timing==='urgent' ? 'H-1B or L-1 (temporary work)' : 'EB-2 / EB-3 (employment green card)') : 'O-1 or self-petition track';
        text = sponsor==='yes'
          ? 'With an employer able to sponsor you, most applicants start with a temporary work visa and later move to an employment-based green card.'
          : 'Without an employer sponsor yet, options are narrower: typically extraordinary-ability categories, or securing a job offer first.';
      } else if(goal==='study'){
        code = 'F-1 student visa'; visaKey = 'F-1 / student visa';
        text = 'An F-1 visa is the standard route for full-time academic study. It is usually paired with a Form I-20 from your school and a SEVIS fee payment.';
      } else {
        code = 'B-1/B-2 visitor visa'; visaKey = 'Visitor visa';
        text = 'For short business or tourism trips, a visitor visa (or ESTA if you are from a Visa Waiver Program country) is the typical route.';
      }
      text += location==='inside'
        ? ' Since you are already in the U.S. in valid status, adjustment of status may let you complete this without leaving the country.'
        : ' Since you are outside the U.S., this will most likely go through consular processing at a U.S. embassy or consulate.';
      $('#result-code').textContent = code;
      $('#result-text').textContent = text;
      store.set('immigravo_visa', visaKey);
      const link = $('#result-book-btn');
      if(link) link.href = 'book.html?visa=' + encodeURIComponent(visaKey);
    };

    next.addEventListener('click', ()=>{ state.step++; render(); });
    back.addEventListener('click', ()=>{ if(state.step>0){ state.step--; render(); } });
    $('#quiz-restart').addEventListener('click', ()=>{
      Object.assign(state, {step:0, goal:null, location:null, sponsor:null, timing:null});
      $$('.opt-list input').forEach(i=>i.checked=false);
      $$('.opt').forEach(o=>o.classList.remove('selected'));
      render();
    });
    render();
  }

  /* ---------- Tools ---------- */
  const checklists = {
    ircr: ['Form I-130, Petition for Alien Relative','Form I-485 or DS-260 (depending on location)','Marriage certificate','Proof of bona fide marriage (joint finances, photos, leases)','Passport-style photos','Medical exam (Form I-693)','Affidavit of Support (Form I-864)'],
    h1b: ['Form I-129, Petition for a Nonimmigrant Worker','Labor Condition Application (certified)','Diploma or degree evaluation','Employment offer letter','Job description matching a specialty occupation','Passport valid 6+ months beyond intended stay'],
    f1: ['Form I-20 from your school (SEVIS)','SEVIS I-901 fee payment receipt','DS-160 confirmation page','Proof of financial support','Academic transcripts and test scores','Passport valid for your program length'],
    eb2: ['PERM labor certification (if required)','Form I-140, Immigrant Petition for Alien Worker','Form I-485 or DS-260','Diploma/degree evaluation and experience letters','Medical exam (Form I-693)','Affidavit of Support, if applicable']
  };
  const processing = {'I-130':'10–14 months','I-485':'11–16 months','I-129':'2–6 months (or 15 days with premium processing)','I-765':'3–5 months'};
  const fees = {
    ircr:{base:1760, dep:1225, label:'Marriage-based green card'},
    h1b:{base:2805, dep:0, label:'H-1B petition'},
    f1:{base:410, dep:0, label:'F-1 student visa'},
    eb2:{base:3025, dep:1225, label:'Employment-based green card'}
  };
  const glossary = [
    ['Priority date','The date USCIS or a consulate receives your petition. It sets your place in line for a visa number.'],
    ['I-140','The immigrant petition an employer files to classify you for an employment-based green card.'],
    ['Adjustment of status','Applying for a green card while remaining inside the United States.'],
    ['Consular processing','Completing your visa application at a U.S. embassy or consulate outside the United States.'],
    ['Labor certification (PERM)','An employer\'s proof to the Department of Labor that no qualified U.S. worker is available for the role.'],
    ['Visa Bulletin','A monthly Department of State chart showing which priority dates can currently move forward.'],
    ['Public charge','An assessment of whether an applicant is likely to depend primarily on the government for support.'],
    ['SEVIS','The system that tracks international students and exchange visitors throughout their program.']
  ];

  const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const buildChecklist = () => {
    const out = $('#checklist-out'); out.innerHTML = '';
    checklists[$('#cl-visa').value].forEach((item,i)=>{
      const li = document.createElement('li');
      li.innerHTML = '<input type="checkbox" id="cl-'+i+'"><label for="cl-'+i+'" style="margin:0;font-weight:500;font-size:14.5px;color:inherit"><span>'+esc(item)+'</span></label>';
      li.querySelector('input').addEventListener('change', e=>li.classList.toggle('checked', e.target.checked));
      out.appendChild(li);
    });
  };
  const filterGlossary = () => {
    const q = $('#gl-search').value.toLowerCase(), out = $('#glossary-out'); out.innerHTML = '';
    const rows = glossary.filter(([t,d])=>t.toLowerCase().includes(q)||d.toLowerCase().includes(q));
    if(!rows.length){ out.innerHTML = '<li><span>No matching terms.</span></li>'; return; }
    rows.forEach(([t,d])=>{ const li=document.createElement('li'); li.innerHTML='<span><b>'+esc(t)+'.</b> '+esc(d)+'</span>'; out.appendChild(li); });
  };

  const panelOpeners = $$('.tool-open');
  if(panelOpeners.length){
    const openPanel = id => {
      const panel = document.getElementById(id); if(!panel) return;
      const wasOpen = panel.classList.contains('open');
      $$('.tool-panel').forEach(p=>p.classList.remove('open'));
      if(wasOpen) return;
      panel.classList.add('open');
      if(id==='panel-checklist') buildChecklist();
      if(id==='panel-glossary') filterGlossary();
      panel.scrollIntoView({behavior:'smooth', block:'nearest'});
    };
    panelOpeners.forEach(b=>b.addEventListener('click', ()=>openPanel(b.dataset.panel)));
    if(location.hash.startsWith('#panel-')) openPanel(location.hash.slice(1));

    $('#cl-visa').addEventListener('change', buildChecklist);
    $('#gl-search').addEventListener('input', filterGlossary);
    $('#pt-go').addEventListener('click', ()=>{
      const f = $('#pt-form').value, c = $('#pt-center').value, out = $('#processing-out');
      out.style.display='block';
      out.innerHTML = '<b>'+esc(processing[f])+'</b><br>Typical range for Form '+esc(f)+' at the '+esc(c)+', based on illustrative data.';
    });
    $('#fee-go').addEventListener('click', ()=>{
      const s = fees[$('#fee-visa').value];
      const deps = Math.max(0, parseInt($('#fee-dependents').value,10) || 0);
      const out = $('#fees-out'); out.style.display='block';
      out.innerHTML = '<b>$'+(s.base + deps*s.dep).toLocaleString('en-US')+'</b><br>Estimated government filing fees for '+esc(s.label)+(deps>0?' plus '+deps+' dependent(s)':'')+'. Attorney and translation fees are not included.';
    });
    $('#receipt-go').addEventListener('click', ()=>{
      const v = $('#receipt').value.trim().toUpperCase(), out = $('#status-out'); out.style.display='block';
      out.innerHTML = /^[A-Z]{3}[0-9]{10}$/.test(v)
        ? '<b>Format looks valid</b><br>Receipt numbers like <strong>'+esc(v)+'</strong> can be checked on the official USCIS Case Status Online page.'
        : '<b>Format not recognized</b><br>USCIS receipt numbers are 3 letters followed by 10 digits (for example, MSC2190012345). Check your notice and try again.';
    });
  }

  /* ---------- Booking ---------- */
  const form = $('#booking-form');
  if(form){
    const sel = $('#bk-visa');
    const wanted = new URLSearchParams(location.search).get('visa') || store.get('immigravo_visa');
    if(wanted){ [...sel.options].forEach(o=>{ if(o.text===wanted) sel.value = o.value; }); }
    const date = $('#bk-date');
    const today = new Date(); today.setMinutes(today.getMinutes()-today.getTimezoneOffset());
    date.min = today.toISOString().slice(0,10);

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const name = ($('#bk-name').value || 'there').trim().split(' ')[0];
      $('#confirm-detail').textContent = 'Thanks, '+name+'. We noted your interest in '+sel.value.toLowerCase()+
        ($('#bk-date').value ? ' for '+$('#bk-date').value : '')+' ('+$('#bk-time').value+'). A team member will confirm your appointment by email within one business day.';
      form.style.display = 'none'; $('#confirm-box').classList.add('show');
    });
    $('#book-again').addEventListener('click', ()=>{
      form.reset(); form.style.display='block'; $('#confirm-box').classList.remove('show');
    });
  }

  /* ---------- FAQ accordion ---------- */
  $$('.faq-q').forEach(btn=>{
    btn.setAttribute('aria-expanded','false');
    btn.addEventListener('click', ()=>{
      const item = btn.closest('.faq-item'), was = item.classList.contains('open');
      $$('.faq-item').forEach(i=>{ i.classList.remove('open'); $('.faq-q', i).setAttribute('aria-expanded','false'); });
      if(!was){ item.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
    });
  });
})();
