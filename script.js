'use strict';
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryNames = {ice:'Ice cream',juices:'Fresh juices',smoothies:'Smoothies'};
let basket = [];
function portionScoopCount(portion) {
  const match = /^([0-9]+) scoops?$/.exec(portion || '');
  return match ? Number(match[1]) : 0;
}
function validLine(line) {
  const product = products.find(p => p.id === line?.id);
  if (!product || !portions[product.category].includes(line.portion) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99 || !Array.isArray(line.flavors) || !line.flavors.every(f => flavorOptions[product.category].includes(f))) return false;
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
  $('#products').innerHTML = matches.map(p => `<article class="product-card"><button class="product-image image-action" data-detail="${p.id}" aria-label="Customize ${p.name}"><img src="assets/generated/${p.image}.jpg?v=20261028-3" alt="${escapeHTML(p.name)} flavor inspiration" loading="lazy" width="1254" height="1254"><span class="tag">${categoryNames[p.category]}</span></button><div class="product-info"><h3><button class="product-title" data-detail="${p.id}">${escapeHTML(p.name)}</button></h3><p>${p.description}</p><div class="product-bottom"><span>${p.category === 'ice' ? 'From one scoop · 4 litre box' : 'Small · Medium · Large'}</span><button class="choose-button" data-detail="${p.id}" aria-label="Customize ${p.name}">${p.custom ? 'Build your mix' : 'Choose & add'} <svg class="icon" aria-hidden="true"><use href="#icon-arrow"/></svg></button></div></div></article>`).join('');
  $('#no-results').hidden = matches.length > 0;

  $('#result-count').textContent = `${matches.length} flavor ideas · availability confirmed in chat`;
}
function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000); }
function lineDescription(line) { const p=products.find(p=>p.id===line.id); const portion=line.portion==='Custom scoops'?`${line.customScoops} custom scoops`:line.portion; return `${p.name} — ${portion}${line.flavors.length ? ' — '+line.flavors.join(' + ') : ''}`; }
function renderBasket() {
  const count=basket.reduce((sum,line)=>sum+line.quantity,0);
  $('#cart-count').textContent=count;$('#quick-count').textContent=count;
  $('.basket-button').setAttribute('aria-label',`Your order, ${count} items`);
  $('#cart-items').innerHTML=basket.length ? basket.map((line,index)=>`<div class="cart-item"><div><strong>${escapeHTML(products.find(p=>p.id===line.id).name)}</strong><small>${escapeHTML(line.portion==='Custom scoops' ? `${line.customScoops} custom scoops` : line.portion)}${line.flavors.length ? ' · '+escapeHTML(line.flavors.join(' + ')) : ''}</small><button class="remove-item" data-remove="${index}">Remove</button></div><div class="quantity"><button data-change="${index}" data-delta="-1" aria-label="Decrease ${escapeHTML(lineDescription(line))}">−</button><span>${line.quantity}</span><button data-change="${index}" data-delta="1" aria-label="Increase ${escapeHTML(lineDescription(line))}" ${line.quantity===99?'disabled':''}>+</button></div></div>`).join('') : '<p class="empty-cart">Your order is waiting for something delicious. Choose a flavor, then select your scoops or drink size.</p>';
  $('#checkout').disabled=!count;
  try {localStorage.setItem('chillos-order-v2',JSON.stringify(basket));} catch {}
}
function openDialog(dialog) {dialog.showModal();document.body.classList.add('modal-open');}
for(const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
}
function openProduct(id) {
  selectedProduct=products.find(p=>p.id===id); if(!selectedProduct)return;
  const p=selectedProduct;
  $('#detail-title').textContent=p.name;$('#detail-description').textContent=p.description;
  $('#detail-image').src=`assets/generated/${p.image}.jpg?v=20261028-3`;$('#detail-image').alt=`${p.name} flavor inspiration`;
  $('#portion-label').textContent=p.category==='ice'?'How many scoops?':'Choose your drink size';
  $('#detail-portion').innerHTML=portions[p.category].map(size=>`<option>${size}</option>`).join('');
  $('#detail-quantity').value='1';$('#detail-scoop-count').value='13';$('#detail-scoop-count').hidden=p.category!== 'ice';$('#detail-scoop-count-label').hidden=p.category!== 'ice';$('#detail-error').textContent='';
  $('#mix-options').hidden=!p.custom;
  $('#flavor-options').innerHTML=p.custom?flavorOptions[p.category].map((flavor,i)=>`<label class="flavor-option"><input type="checkbox" name="flavor" value="${escapeHTML(flavor)}"><span>${escapeHTML(flavor)}</span></label>`).join(''):'';
  updateMixHint();openDialog($('#product-detail'));
}
function selectedScoopCount(){
  const portion=$('#detail-portion').value;
  if(portion==='Custom scoops') return Number($('#detail-scoop-count').value);
  if(portion==='Full box – 4 litres') return 20;
  return portionScoopCount(portion);
}
function updatePortionDetails(){
  if(!selectedProduct)return;
  const custom=$('#detail-portion').value==='Custom scoops';
  $('#detail-scoop-count-label').hidden=selectedProduct.category!== 'ice'||!custom;
  $('#detail-scoop-count').hidden=!custom;
}
function updateMixHint(){
  if(!selectedProduct)return;
  const count=selectedScoopCount();
  $('#mix-hint').textContent=selectedProduct.category==='ice'?`Choose up to ${count} flavor(s), one per scoop. Repeated scoops of a flavor can be requested in notes.`:'Choose up to 5 fruits or flavors. Ask the team about the blend base and ingredients.';
  updatePortionDetails();
}
function addSelection(){
  const quantity=Number($('#detail-quantity').value), portion=$('#detail-portion').value;
  const flavors=Array.from(document.querySelectorAll('#flavor-options input:checked'),input=>input.value).sort();
  const customScoops=selectedProduct.category==='ice'&&portion==='Custom scoops'?Number($('#detail-scoop-count').value):undefined;
  const line={id:selectedProduct.id,quantity,portion,flavors,...(customScoops?{customScoops}:{})};
  if(!validLine(line)) {$('#detail-error').textContent=selectedProduct.custom?'Choose at least one flavor, stay within the flavor limit, and enter 1–99 servings.':'Choose a portion and enter 1–99 servings.';return;}
  const match=basket.find(item=>item.id===line.id&&item.portion===portion&&JSON.stringify(item.flavors)===JSON.stringify(flavors));
  if(match&&match.quantity+quantity>99){$('#detail-error').textContent='Maximum 99 of each selection. Contact us for larger orders.';return;}
  if(match)match.quantity+=quantity;else basket.push(line);
  renderBasket();$('#product-detail').close();toast(`${selectedProduct.name} added to your order`);
}
document.addEventListener('click',event=>{
  const detail=event.target.closest('[data-detail]');if(detail)openProduct(detail.dataset.detail);
  const change=event.target.closest('[data-change]');if(change){const index=Number(change.dataset.change);if(basket[index]){basket[index].quantity=Math.min(99,basket[index].quantity+Number(change.dataset.delta));if(basket[index].quantity<=0)basket.splice(index,1);renderBasket();}}
  const remove=event.target.closest('[data-remove]');if(remove){basket.splice(Number(remove.dataset.remove),1);renderBasket();}
  const photo=event.target.closest('[data-gallery]');if(photo){$('#lightbox-image').src=photo.dataset.gallery;$('#lightbox-image').alt=photo.querySelector('img').alt;openDialog($('#lightbox'));}
});
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));});renderProducts();});
$('#search').addEventListener('input',()=>{renderProducts();});
$('#reset-menu').addEventListener('click',()=>{filter='all';$('#search').value='';document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter==='all';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});renderProducts();});
$('#quick-order').addEventListener('click',()=>openDialog($('#cart')));
$('#detail-portion').addEventListener('change',updateMixHint);
$('#detail-scoop-count').addEventListener('input',updateMixHint);
$('#detail-add').addEventListener('click',addSelection);
$('#close-product').addEventListener('click',()=>$('#product-detail').close());
$('[data-open-cart]').addEventListener('click',()=>openDialog($('#cart')));
$('[data-close-cart]').addEventListener('click',()=>$('#cart').close());
$('#close-lightbox').addEventListener('click',()=>$('#lightbox').close());
$('[data-continue-shopping]').addEventListener('click',()=>{$('#cart').close();$('#menu').scrollIntoView();});
$('.menu-toggle').addEventListener('click',()=>{const expanded=$('.menu-toggle').getAttribute('aria-expanded')!=='true';$('.menu-toggle').setAttribute('aria-expanded',String(expanded));$('.menu-toggle').setAttribute('aria-label',expanded?'Close navigation':'Open navigation');$('#navigation').classList.toggle('open',expanded);});
$('#navigation').addEventListener('click',event=>{if(event.target.closest('a')){$('#navigation').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle').setAttribute('aria-label','Open navigation');}});
$('#fulfillment').addEventListener('change',()=>{const delivery=$('#fulfillment').value==='Delivery';$('#address-label').hidden=!delivery;$('#address').required=delivery;});
$('#order-form').addEventListener('submit',event=>{
  event.preventDefault();if(!basket.length)return;
  const name=$('#customer-name').value.trim(),phone=$('#customer-phone').value.trim(),address=$('#address').value.trim(),delivery=$('#fulfillment').value==='Delivery';
  if(!name||phone.replace(/\D/g,'').length<9||(delivery&&!address)){toast('Enter your name, a valid phone number, and delivery address if needed.');return;}
  const lines=['Hello Chillos! I would like to request an order.','',`Name: ${name}`,`Phone: ${phone}`,'',...basket.map(line=>`${line.quantity} × ${lineDescription(line)}`),'',`Method: ${$('#fulfillment').value}`];
  if(delivery)lines.push(`Delivery details: ${address}`);if($('#notes').value.trim())lines.push(`Notes: ${$('#notes').value.trim()}`);
  lines.push('','Please review my selections and discuss the final price with me on WhatsApp, based on the scoops, drink sizes, flavors, quantities, and delivery choice. Please also confirm flavor availability, any delivery fee, and preparation time. Thank you!');
  window.location.assign(`https://wa.me/250781281062?text=${encodeURIComponent(lines.join('\n'))}`);
});
$('#year').textContent=new Date().getFullYear();renderProducts();renderBasket();

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
