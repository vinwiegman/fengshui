const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const photoInput = $('#photoInput');
const grid = $('#photoGrid');
const toast = $('#toast');

function updateCount() {
  const n = $$('.photo-card').length;
  $('#photoCount').textContent = `${n} of 8 photos`;
}

function addFiles(files) {
  const slots = 8 - $$('.photo-card').length;
  [...files].slice(0, slots).forEach((file) => {
    const card = document.createElement('article');
    card.className = 'photo-card user-photo';
    card.innerHTML = `<img alt="Uploaded item photo"><span class="photo-label">Extra angle</span><button class="remove-photo" aria-label="Remove photo">×</button>`;
    card.querySelector('img').src = URL.createObjectURL(file);
    grid.insertBefore(card, grid.querySelector('.add-photo'));
  });
  updateCount();
}

photoInput.addEventListener('change', (e) => addFiles(e.target.files));
grid.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-photo')) { e.target.closest('.photo-card').remove(); updateCount(); }
});
grid.addEventListener('dragover', (e) => { e.preventDefault(); grid.querySelector('.add-photo').style.background = '#e5f2eb'; });
grid.addEventListener('dragleave', () => grid.querySelector('.add-photo').style.background = '');
grid.addEventListener('drop', (e) => { e.preventDefault(); grid.querySelector('.add-photo').style.background = ''; addFiles(e.dataTransfer.files); });

function countText(input, output, max) { $(output).textContent = `${$(input).value.length} / ${max}`; }
$('#title').addEventListener('input', () => countText('#title','#titleCount',60));
$('#description').addEventListener('input', () => countText('#description','#descCount',1000));
countText('#title','#titleCount',60); countText('#description','#descCount',1000);

function listingText() { return `${$('#title').value}\n\n${$('#description').value}`; }
async function copyListing() {
  try { await navigator.clipboard.writeText(listingText()); }
  catch { const t=document.createElement('textarea');t.value=listingText();document.body.appendChild(t);t.select();document.execCommand('copy');t.remove(); }
  toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600);
}
$('#copyBtn').addEventListener('click', copyListing);
$('#plainCopyBtn').addEventListener('click', () => { copyListing(); $('#exportModal').classList.remove('open'); });
$('#exportBtn').addEventListener('click', () => $('#exportModal').classList.add('open'));
$('#modalClose').addEventListener('click', () => $('#exportModal').classList.remove('open'));
$('#exportModal').addEventListener('click', (e) => { if(e.target.id==='exportModal') e.currentTarget.classList.remove('open'); });
$('#printBtn').addEventListener('click', () => { $('#exportModal').classList.remove('open'); window.print(); });

$('#addLabelBtn').addEventListener('click', () => photoInput.click());
$('#addFinding').addEventListener('click', () => {
  const note = prompt('Describe the visible condition detail:');
  if (!note) return;
  const row = document.createElement('label'); row.className='finding';
  row.innerHTML=`<input type="checkbox" checked><span class="finding-thumb"></span><span><strong>${note.replace(/[<>]/g,'')}</strong><small>Added manually · Visible detail</small></span><em>Included</em>`;
  $('#addFinding').before(row);
});
$('#regenerateBtn').addEventListener('click', () => {
  const b=$('#brand').value,m=$('#model').value,c=$('#color').value,s=$('#size').value;
  $('#title').value=`${b} ${m} ${c} — ${s}`.slice(0,60);
  $('#description').value=`${b} ${m} sneakers in ${c.toLowerCase()}. A versatile everyday pair with a classic low-top silhouette.\n\nCondition: ${$('#condition').value}. Light cosmetic scuffing on the right toe and minor sole wear are clearly shown in the photos. No structural damage detected.\n\n• Model: ${b} ${m}\n• Colour: ${c}\n• Size: ${s} (please confirm against the label photo)\n\nFrom a smoke-free home.`;
  countText('#title','#titleCount',60); countText('#description','#descCount',1000);
});
$('#resetBtn').addEventListener('click', () => { if(confirm('Clear your edits and start over?')) location.reload(); });
