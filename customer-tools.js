'use strict';

// Owner-confirmed regular menu picks. Set inclusive YYYY-MM-DD dates for seasonal picks.
const menuHighlights = [
  {id:'strawberry', label:'Customer favourite', starts:'', ends:''},
  {id:'orange-juice', label:'Freshly prepared', starts:'', ends:''},
  {id:'custom-smoothie', label:'Make it your own', starts:'', ends:''}
];
function activeHighlights(today=kigaliToday()) {
  return menuHighlights.filter(item=>(!item.starts||item.starts<=today)&&(!item.ends||today<=item.ends)&&products.some(p=>p.id===item.id));
}
function renderHighlights(){
  const picks=activeHighlights();
  $('#menu-highlights').hidden=!picks.length;
  $('#highlight-items').innerHTML=picks.map(pick=>{
    const p=products.find(p=>p.id===pick.id);
    return `<button class="highlight-card" type="button" data-detail="${p.id}"><img src="assets/generated/${p.image}.jpg?v=20261028-3" alt="" loading="lazy" width="160" height="160"><span><small>${escapeHTML(pick.label)}</small><strong>${escapeHTML(p.name)}</strong><span class="highlight-cta">Choose your portion</span></span></button>`;
  }).join('');
}
renderHighlights();

const customerStorageKey='chillos-customer-v1';
const rememberedFields={'customer-name':80,'customer-phone':20,address:240,'pickup-branch':80};
function forgetCustomer(){
  $('#remember-customer').checked=false;
  try{localStorage.removeItem(customerStorageKey);}catch{
    $('#remember-status').textContent='This browser could not remove saved details. Clear this site’s data in your browser settings.';return;
  }
  $('#remember-status').textContent='Saved details removed from this browser. Current form entries are unchanged.';
}
function saveCustomer(){
  if(!$('#remember-customer').checked)return;
  const details={};
  for(const [id,max] of Object.entries(rememberedFields))details[id]=$('#'+id).value.slice(0,max);
  try{localStorage.setItem(customerStorageKey,JSON.stringify(details));$('#remember-status').textContent='Your details are saved on this device.';}
  catch{$('#remember-status').textContent='This browser could not save your details. You can still continue.';}
}
try{
  const details=JSON.parse(localStorage.getItem(customerStorageKey)||'null');
  if(details&&typeof details==='object'&&!Array.isArray(details)){
    for(const [id,max] of Object.entries(rememberedFields))if(typeof details[id]==='string')$('#'+id).value=details[id].slice(0,max);
    $('#remember-customer').checked=true;
    $('#remember-status').textContent='Your saved details have been filled in. Please check them before ordering.';
  }
}catch{}
$('#remember-customer').addEventListener('change',()=>{if(!$('#remember-customer').checked)forgetCustomer();else $('#remember-status').textContent='Your details will be saved when you review your order.';});
$('#forget-customer').addEventListener('click',forgetCustomer);

let pendingOrderMessage='';
function reviewOrder(message){
  pendingOrderMessage=message;saveCustomer();
  $('#order-review-text').textContent=message;
  openDialog($('#order-review'));
}
$('#review-back').addEventListener('click',()=>{$('#order-review').close();pendingOrderMessage='';});
$('#review-send').addEventListener('click',()=>{
  if(pendingOrderMessage){saveLastSelection();window.location.assign(`https://wa.me/250781281062?text=${encodeURIComponent(pendingOrderMessage)}`);}
});

const lastSelectionKey='chillos-last-selection-v1';
let lastSelection=[];
function cleanSelections(lines){
  return Array.isArray(lines)?lines.filter(validLine).map(line=>({id:line.id,portion:line.portion,quantity:line.quantity,flavors:[...line.flavors],...(line.portion==='Custom scoops'?{customScoops:line.customScoops}:{})})):[];
}
try{lastSelection=cleanSelections(JSON.parse(localStorage.getItem(lastSelectionKey)||'null'));}catch{}
function renderReorder(){ $('#reorder-panel').hidden=!lastSelection.length; }
function saveLastSelection(){
  lastSelection=cleanSelections(basket);
  try{localStorage.setItem(lastSelectionKey,JSON.stringify(lastSelection));}catch{}
  renderReorder();
}
renderReorder();
$('#order-again').addEventListener('click',()=>{
  if(!lastSelection.length)return;
  $('#reorder-error').textContent='';
  $('#reorder-items').innerHTML=lastSelection.map(line=>`<li>${line.quantity} &times; ${escapeHTML(lineDescription(line))}</li>`).join('');
  openDialog($('#reorder-dialog'));
});
$('#reorder-cancel').addEventListener('click',()=>$('#reorder-dialog').close());
$('#reorder-add').addEventListener('click',()=>{
  const next=cleanSelections(basket);
  for(const line of cleanSelections(lastSelection)){
    const match=next.find(item=>item.id===line.id&&item.portion===line.portion&&item.customScoops===line.customScoops&&JSON.stringify([...item.flavors].sort())===JSON.stringify([...line.flavors].sort()));
    if(match){
      if(match.quantity+line.quantity>99){$('#reorder-error').textContent='Adding this selection would exceed 99 of an item. Reduce its quantity in your basket first.';return;}
      match.quantity+=line.quantity;
    }else next.push(line);
  }
  basket=next;renderBasket();$('#reorder-dialog').close();
  $('#basket-feedback').textContent='Your previous items were added. Check the quantities before continuing.';
});
$('#forget-order').addEventListener('click',()=>{
  try{localStorage.removeItem(lastSelectionKey);}catch{$('#basket-feedback').textContent='Could not remove saved history. Clear this site’s data in browser settings.';return;}
  lastSelection=[];renderReorder();$('#basket-feedback').textContent='Last order forgotten. Your current basket is unchanged.';
});

function selectionText(){
  return ['My Chillos selection', ...basket.map(line=>`${line.quantity} × ${lineDescription(line)}`),'Order yours at https://alainrichard.github.io/chillos-Ice-Cream/'].join('\n');
}
$('#share-selection').addEventListener('click',()=>{
  $('#share-status').textContent='';
  if(!basket.length){$('#basket-feedback').textContent='Choose a treat before sharing your selection.';return;}
  $('#share-text').value=selectionText();
  $('#share-native').hidden=typeof navigator==='undefined'||typeof navigator.share!=='function';
  openDialog($('#share-dialog'));
});
$('#close-share').addEventListener('click',()=>$('#share-dialog').close());
$('#share-copy').addEventListener('click',async()=>{
  try{
    if(typeof navigator==='undefined'||!navigator.clipboard)throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText($('#share-text').value);
    $('#share-status').textContent='Copied. Paste it into any chat.';
  }catch{
    $('#share-text').focus();$('#share-text').select();
    $('#share-status').textContent='Copying is blocked in this browser. The text is selected, so use your device’s copy command.';
  }
});
$('#share-native').addEventListener('click',async()=>{
  try{await navigator.share({title:'My Chillos selection',text:$('#share-text').value});$('#share-status').textContent='Shared.';}
  catch(error){if(error.name!=='AbortError')$('#share-status').textContent='Sharing is unavailable on this device. Use Copy text instead.';}
});
