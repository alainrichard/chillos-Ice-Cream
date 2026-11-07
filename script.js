'use strict';
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryNames = {ice:'Ice cream',juices:'Fresh juices',smoothies:'Smoothies'};
let basket = [];
let clearedBasket = null;
let editingIndex = null;
function portionScoopCount(portion) {
  const match = /^([0-9]+) scoops?$/.exec(portion || '');
  return match ? Number(match[1]) : 0;
}
function validLine(line) {
  if (!line || typeof line !== 'object') return false;
  const product = products.find(p => p.id === line?.id);
  if (!product || !portions[product.category].includes(line.portion) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99 || !Array.isArray(line.flavors) || !line.flavors.every(f => flavorOptions[product.category].includes(f))) return false;
  if (new Set(line.flavors).size !== line.flavors.length || (!product.custom && line.flavors.length)) return false;
  const scoopLimit = line.portion === 'Full box – 4 litres' ? 20 : portionScoopCount(line.portion);
  const customCountValid = product.category !== 'ice' || line.portion !== 'Custom scoops' || (Number.isInteger(line.customScoops) && line.customScoops >= 13 && line.customScoops <= 99);
  return customCountValid && line.flavors.length <= (product.category === 'ice' ? (scoopLimit || line.customScoops || 12) : 5) && (!product.custom || line.flavors.length > 0);
}
try {
  const saved = JSON.parse(localStorage.getItem('chillos-order-v2') || 'null');
  if (Array.isArray(saved)) basket = saved.filter(validLine);
  else {
    const old = JSON.parse(localStorage.getItem('chillos-basket') || '{}');
    for (const p of products) if (!p.custom && Number.isInteger(old?.[p.id]) && old[p.id] > 0 && old[p.id] <= 99) basket.push({id:p.id,portion:portions[p.category][0],flavors:[],quantity:old[p.id]});
  }
} catch {}
let filter = 'all', selectedProduct, toastTimer;
function renderProducts() {
  const query = $('#search').value.trim().toLowerCase();
  const matches = products.filter(p => (filter === 'all' || p.category === filter) && `${p.name} ${p.description} ${categoryNames[p.category]} ${p.custom ? flavorOptions[p.category].join(' ') : ''}`.toLowerCase().includes(query));
  $('#products').innerHTML = matches.map(p => {
    const name = escapeHTML(p.name);
    const options = p.category === 'ice' ? '1–99 scoops or 4 litre box' : 'Small · Medium · Large';
    return `<article class="product-card${p.custom ? ' is-custom' : ''}"><button class="product-image" type="button" data-detail="${p.id}" tabindex="-1" aria-hidden="true"><img src="assets/generated/${p.image}.jpg?v=20261028-3" alt="" loading="lazy" width="1254" height="1254"><span class="tag">${p.custom ? 'Build your own' : categoryNames[p.category]}</span></button><div class="product-info"><h3>${name}</h3><p>${escapeHTML(p.description)}</p><div class="product-bottom"><span>${options}</span><button class="choose-button" type="button" data-detail="${p.id}" aria-label="${p.custom ? 'Build' : 'Choose'} ${name}">${p.custom ? 'Build your mix' : 'Choose'} <svg class="icon" aria-hidden="true"><use href="#icon-arrow"/></svg></button></div></div></article>`;
  }).join('');
  $('#no-results').hidden = matches.length > 0;
  $('#reset-menu').hidden = filter === 'all' && !query;
  const scope = filter === 'all' ? 'items' : categoryNames[filter].toLowerCase();
  $('#result-count').textContent = query ? `${matches.length} result${matches.length === 1 ? '' : 's'} for “${$('#search').value.trim()}”` : `Showing ${matches.length} ${scope}`;
}
function toast(message, viewOrder=false) { $('#toast-message').textContent=message; $('#toast-view').hidden=!viewOrder; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),viewOrder?8000:5000); }
function dismissUndo(){ clearedBasket=null; $('#undo-clear').hidden=true; }
$('#toast-view').addEventListener('click',()=>{$('#toast').classList.remove('visible');openDialog($('#cart'));});
$('#toast-dismiss').addEventListener('click',()=>$('#toast').classList.remove('visible'));
function lineDescription(line) { const p=products.find(p=>p.id===line.id); const portion=line.portion==='Custom scoops'?`${line.customScoops} custom scoops`:line.portion; return `${p.name} — ${portion}${line.flavors.length ? ' — '+line.flavors.join(' + ') : ''}`; }
function renderBasket() {
  const count=basket.reduce((sum,line)=>sum+line.quantity,0);
  $('#cart-count').textContent=count;$('#quick-count').textContent=count;
  $('.basket-button').setAttribute('aria-label',`Your order, ${count} items`);
  $('#cart-items').innerHTML=basket.length ? basket.map((line,index)=>{
    const product=products.find(p=>p.id===line.id), label=escapeHTML(lineDescription(line));
    return `<div class="cart-item"><img src="assets/generated/${product.image}.jpg?v=20261028-3" alt="" width="64" height="64" loading="lazy"><div class="cart-item-body"><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(line.portion==='Custom scoops' ? `${line.customScoops} custom scoops` : line.portion)}${line.flavors.length ? ' · '+escapeHTML(line.flavors.join(' + ')) : ''}</small><div class="item-actions"><button class="edit-item" type="button" data-edit="${index}" aria-label="Edit ${label}">Edit</button><button class="remove-item" type="button" data-remove="${index}" aria-label="Remove ${label}">Remove</button></div></div><div class="quantity"><button type="button" data-change="${index}" data-delta="-1" aria-label="Decrease ${label}">−</button><span aria-label="Quantity">${line.quantity}</span><button type="button" data-change="${index}" data-delta="1" aria-label="Increase ${label}" ${line.quantity===99?'disabled':''}>+</button></div></div>`;
  }).join('') : '<p class="empty-cart"><strong>Your order is empty.</strong>Choose a treat from the menu to get started.</p>';
  $('#checkout').disabled=!count;
  $('#basket-summary').textContent=count ? `${count} item${count===1?'':'s'}` : '';
  $('#share-selection').hidden=!count;
  $('#clear-order').hidden=!count;
  $('#order-form').hidden=!count;
  $('#empty-browse').hidden=Boolean(count);
  try {localStorage.setItem('chillos-order-v2',JSON.stringify(basket));} catch {}
}
function openDialog(dialog) {if(!dialog.open)dialog.showModal();document.body.classList.add('modal-open');}
for(const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('close',()=>document.body.classList.toggle('modal-open', Boolean(document.querySelector('dialog[open]'))));
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
}
function openProduct(id) {
  editingIndex=null;
  $('#detail-add').textContent='Add to order';
  selectedProduct=products.find(p=>p.id===id); if(!selectedProduct)return;
  const p=selectedProduct;
  $('#detail-title').textContent=p.name;$('#detail-description').textContent=p.description;
  $('#detail-image').src=`assets/generated/${p.image}.jpg?v=20261028-3`;$('#detail-image').alt=p.name;
  $('#portion-label').textContent=p.category==='ice'?'How many scoops?':'Choose your drink size';
  $('#detail-portion').innerHTML=portions[p.category].map(size=>`<option>${size}</option>`).join('');
  $('#detail-quantity').value='1';$('#detail-scoop-count').value='13';$('#detail-scoop-count').hidden=p.category!== 'ice';$('#detail-scoop-count-label').hidden=p.category!== 'ice';$('#detail-error').textContent='';
  $('#mix-options').hidden=!p.custom;
  $('#flavor-options').innerHTML=p.custom?flavorOptions[p.category].map((flavor,i)=>`<label class="flavor-option"><input type="checkbox" name="flavor" value="${escapeHTML(flavor)}"><span>${escapeHTML(flavor)}</span></label>`).join(''):'';
  updateMixHint();openDialog($('#product-detail'));
}
function editSelection(index) {
  const line=basket[index];if(!line)return;
  openProduct(line.id);editingIndex=index;
  $('#detail-portion').value=line.portion;
  $('#detail-quantity').value=String(line.quantity);
  $('#detail-scoop-count').value=String(line.customScoops || 13);
  for(const input of document.querySelectorAll('#flavor-options input'))input.checked=line.flavors.includes(input.value);
  $('#detail-add').textContent='Save changes';updateMixHint();
}
function selectedScoopCount(){
  const portion=$('#detail-portion').value;
  if(portion==='Custom scoops') return Number($('#detail-scoop-count').value);
  if(portion==='Full box – 4 litres') return 20;
  return portionScoopCount(portion);
}
function updatePortionDetails(){
  if(!selectedProduct)return;
  const portion=$('#detail-portion').value;
  const custom=portion==='Custom scoops';
  $('#detail-scoop-count-label').hidden=selectedProduct.category!== 'ice'||!custom;
  $('#detail-scoop-count').hidden=!custom;
  const fullBox=selectedProduct.category==='ice'&&portion==='Full box – 4 litres';
  $('#detail-image').src=fullBox
    ?'assets/generated/four-litre-box.jpg?v=20261029-3'
    :`assets/generated/${selectedProduct.image}.jpg?v=20261028-3`;
  $('#detail-image').alt=fullBox?'Chillos 4 litre sharing box':selectedProduct.name;
}
function updateMixHint(){
  if(!selectedProduct)return;
  const count=selectedScoopCount();
  if(selectedProduct.category==='ice' && $('#detail-portion').value==='Full box – 4 litres') {
    $('#mix-hint').textContent='Choose up to 20 flavours for your 4 litre box. Add the split you would like in your order notes.';
    updatePortionDetails();return;
  }
  const limit=Number.isInteger(count)&&count>0?count:1;
  $('#mix-hint').textContent=selectedProduct.category==='ice'?(limit===1?'Choose 1 flavour.':`Choose up to ${limit} flavours, one per scoop. For repeats of the same flavour, add a note to your order.`):'Choose up to 5 fruits or ingredients.';
  updatePortionDetails();
}
function addSelection(){
  const quantity=Number($('#detail-quantity').value), portion=$('#detail-portion').value;
  const flavors=selectedProduct.custom ? Array.from(document.querySelectorAll('#flavor-options input:checked'),input=>input.value).sort() : [];
  const customScoops=selectedProduct.category==='ice'&&portion==='Custom scoops'?Number($('#detail-scoop-count').value):undefined;
  const line={id:selectedProduct.id,quantity,portion,flavors,...(customScoops?{customScoops}:{})};
  if(portion==='Custom scoops' && (!Number.isInteger(customScoops)||customScoops<13||customScoops>99)) {$('#detail-error').textContent='Enter a whole number of scoops from 13 to 99.';return;}
  if(!validLine(line)) {$('#detail-error').textContent=selectedProduct.custom?'Choose at least one flavour (within the limit for your portion) and a quantity from 1 to 99.':'Choose a portion and a quantity from 1 to 99.';return;}
  const match=basket.find((item,index)=>index!==editingIndex&&item.id===line.id&&item.portion===portion&&(portion!=='Custom scoops'||item.customScoops===customScoops)&&JSON.stringify([...item.flavors].sort())===JSON.stringify(flavors));
  if(match&&match.quantity+quantity>99){$('#detail-error').textContent='Maximum 99 of each selection. Contact us for larger orders.';return;}
  const wasEditing=editingIndex!==null;
  if(match){match.quantity+=quantity;if(wasEditing)basket.splice(editingIndex,1);}
  else if(wasEditing)basket[editingIndex]=line;
  else basket.push(line);
  editingIndex=null;dismissUndo();
  renderBasket();$('#product-detail').close();$('#basket-feedback').textContent=wasEditing?'Your selection has been updated.':'';toast(`${selectedProduct.name} ${wasEditing?'updated':'added to your order'}`,!wasEditing);
}
document.addEventListener('click',event=>{
  const edit=event.target.closest('[data-edit]');if(edit)editSelection(Number(edit.dataset.edit));
  const detail=event.target.closest('[data-detail]');if(detail){openProduct(detail.dataset.detail);if(detail.dataset.portion){$('#detail-portion').value=detail.dataset.portion;updateMixHint();}}
  const change=event.target.closest('[data-change]');if(change){const index=Number(change.dataset.change);if(basket[index]){dismissUndo();basket[index].quantity=Math.min(99,basket[index].quantity+Number(change.dataset.delta));if(basket[index].quantity<=0)basket.splice(index,1);renderBasket();}}
  const remove=event.target.closest('[data-remove]');if(remove&&basket[Number(remove.dataset.remove)]){dismissUndo();basket.splice(Number(remove.dataset.remove),1);renderBasket();$('#basket-feedback').textContent='Item removed.';}
  const photo=event.target.closest('[data-gallery]');if(photo){$('#lightbox-image').src=photo.dataset.gallery;$('#lightbox-image').alt=photo.querySelector('img').alt;openDialog($('#lightbox'));}
});
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));});renderProducts();});
$('#search').addEventListener('input',()=>{renderProducts();});
$('#reset-menu').addEventListener('click',()=>{filter='all';$('#search').value='';document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter==='all';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});renderProducts();});
$('#quick-order').addEventListener('click',()=>openDialog($('#cart')));
$('#empty-browse').addEventListener('click',()=>{$('#cart').close();$('#menu').scrollIntoView();});
$('#clear-order').addEventListener('click',()=>{
  if(!basket.length)return;
  clearedBasket=basket.map(line=>({...line,flavors:[...line.flavors]}));basket=[];renderBasket();
  $('#basket-feedback').textContent='All items removed.';
  $('#undo-clear').hidden=false;$('#undo-clear').focus();
});
$('#undo-clear').addEventListener('click',()=>{
  if(!clearedBasket)return;
  basket.push(...clearedBasket);clearedBasket=null;renderBasket();
  $('#basket-feedback').textContent='Your items have been restored.';$('#undo-clear').hidden=true;$('#clear-order').focus();
});
$('#detail-portion').addEventListener('change',updateMixHint);
$('#detail-scoop-count').addEventListener('input',updateMixHint);
$('#detail-add').addEventListener('click',addSelection);
$('#close-product').addEventListener('click',()=>$('#product-detail').close());
$('[data-open-cart]').addEventListener('click',()=>openDialog($('#cart')));
$('[data-close-cart]').addEventListener('click',()=>$('#cart').close());
$('#close-lightbox').addEventListener('click',()=>$('#lightbox').close());
$('[data-continue-shopping]').addEventListener('click',()=>{$('#cart').close();$('#menu').scrollIntoView();});
function setNavigation(open){$('.menu-toggle').setAttribute('aria-expanded',String(open));$('.menu-toggle').setAttribute('aria-label',open?'Close navigation':'Open navigation');$('#navigation').classList.toggle('open',open);}
$('.menu-toggle').addEventListener('click',()=>setNavigation($('.menu-toggle').getAttribute('aria-expanded')!=='true'));
$('#navigation').addEventListener('click',event=>{if(event.target.closest('a'))setNavigation(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#navigation').classList.contains('open')){setNavigation(false);$('.menu-toggle').focus();}});
function updateFulfillment(){const delivery=$('#fulfillment').value==='Delivery';$('#address-label').hidden=!delivery;$('#address').required=delivery;$('#pickup-label').hidden=delivery;$('#pickup-branch').disabled=delivery;}
$('#fulfillment').addEventListener('change',updateFulfillment);
updateFulfillment();
$('#order-form').addEventListener('submit',event=>{
  pendingOrderMessage='';
  event.preventDefault();if(!basket.length)return;
  const name=$('#customer-name').value.trim(),phone=$('#customer-phone').value.trim(),address=$('#address').value.trim(),delivery=$('#fulfillment').value==='Delivery';
  $('#order-error').textContent='';
  const digits=phone.replace(/\D/g,'');
  if(!name||!/^\+?[\d\s().-]+$/.test(phone)||digits.length<9||digits.length>15||(delivery&&!address)){
    $('#order-error').textContent=!name?'Please enter your name.':(digits.length<9||digits.length>15||!/^\+?[\d\s().-]+$/.test(phone))?'Please enter a valid phone number (9–15 digits).':'Please enter your delivery address.';
    return;
  }
  const lines=['Hello Chillos! I would like to request an order.','',`Name: ${name}`,`Phone: ${phone}`,'',...basket.map(line=>`${line.quantity} × ${lineDescription(line)}`),'',`Method: ${$('#fulfillment').value}`];
  if(!delivery)lines.push(`Pickup branch: ${$('#pickup-branch').value || 'Please help me choose'}`);
  if($('#preferred-time').value.trim())lines.push(`Preferred timing (Kigali time, subject to confirmation): ${$('#preferred-time').value.trim()}`);
  if(delivery)lines.push(`Delivery details: ${address}`);if($('#notes').value.trim())lines.push(`Notes: ${$('#notes').value.trim()}`);
  lines.push('','Please review my selections and discuss the final price with me on WhatsApp, based on the scoops, drink sizes, flavors, quantities, and delivery choice. Please also confirm flavor availability, any delivery fee, and preparation time. Thank you!');
  reviewOrder(lines.join('\n'));
});
$('#year').textContent=new Date().getFullYear();renderProducts();renderBasket();

function kigaliToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Kigali',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
$('#party-date').min=kigaliToday();
for(const button of document.querySelectorAll('[data-open-party]'))button.addEventListener('click',()=>{$('#party-date').min=kigaliToday();openDialog($('#party-dialog'));});
$('#close-party').addEventListener('click',()=>$('#party-dialog').close());
$('#party-form').addEventListener('submit',event=>{
  event.preventDefault();$('#party-error').textContent='';
  const name=$('#party-name').value.trim(),guests=Number($('#party-guests').value),date=$('#party-date').value;
  if(!name||!Number.isInteger(guests)||guests<1||guests>10000||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<kigaliToday()){
    $('#party-error').textContent='Enter your name, 1–10,000 guests, and a date today or later.';return;
  }
  const lines=['Hello Chillos! I would like to discuss a party order.',`Name: ${name}`,`Occasion: ${$('#party-occasion').value}`,`Guests: ${guests}`,`Date: ${date}`,`Preferred time (Kigali): ${$('#party-time').value || 'To be agreed'}`,`Pickup or delivery preference: ${$('#party-method').value}`,`Preferences, location and allergies: ${$('#party-notes').value.trim() || 'To be discussed'}`,'Please recommend portions and confirm flavors, ingredients, price, location, and timing. This is an enquiry, not a confirmed booking.'];
  window.location.assign(`https://wa.me/250781281062?text=${encodeURIComponent(lines.join('\n'))}`);
});

// Top navigation shortcuts open the matching category and clear any old search.
for (const link of document.querySelectorAll('[data-category]')) {
  link.addEventListener('click', () => {
    filter = link.dataset.category;
    $('#search').value = '';
    document.querySelectorAll('[data-filter]').forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderProducts();
  });
}
