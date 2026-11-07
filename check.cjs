'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
assert(!/<style\b|\sstyle=|\sonclick=/.test(html));
assert(!/500 RWF|RWF|Ask for price|detail-price|price-sticker/.test(html));
for(const file of ['styles.css','catalog.js','script.js'])assert(html.includes(file));
assert.equal(html,fs.readFileSync('Chillos Ice Cream & Fresh Juice – Kigali.html','utf8'));
for(const [,anchor] of html.matchAll(/href="#([^"]+)"/g))assert(html.includes(`id="${anchor}"`));
const nodes=new Map(),listeners={},storage={};let checked=[],destination;
function node(key){if(!nodes.has(key))nodes.set(key,{value:'',innerHTML:'',textContent:'',hidden:false,handlers:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(type,fn){this.handlers[type]=fn;},showModal(){},close(){},focus(){},scrollIntoView(){}});return nodes.get(key);}
const context={document:{querySelector:node,querySelectorAll:s=>s==='#flavor-options input:checked'?checked:[],addEventListener:(type,fn)=>listeners[type]=fn,body:{classList:{add(){},remove(){}}}},localStorage:{getItem:key=>storage[key]||null,setItem:(key,val)=>storage[key]=val,removeItem:key=>delete storage[key]},window:{location:{assign:url=>destination=url}},setTimeout:()=>0,clearTimeout(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync('catalog.js','utf8')+'\n'+fs.readFileSync('script.js','utf8')+'\n'+fs.readFileSync('customer-tools.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
function submitOrder(){node('#order-form').handlers.submit({preventDefault(){}});node('#review-send').handlers.click();}
assert.equal(run('products.length'),30);assert.equal((node('#products').innerHTML.match(/product-card/g)||[]).length,30);
node('#search').value='hazelnut';node('#search').handlers.input();assert(node('#products').innerHTML.includes('Create your scoop mix'));
node('#search').value='not-a-real-flavor';node('#search').handlers.input();assert.equal(node('#no-results').hidden,false);
node('#search').value='';run("filter='juices';renderProducts()");assert(node('#products').innerHTML.includes('Orange juice'));assert(!node('#products').innerHTML.includes('Pistachio'));
run("openProduct('orange-juice')");node('#detail-portion').value='Small';node('#detail-quantity').value='2';node('#detail-add').handlers.click();
run("openProduct('orange-juice')");node('#detail-portion').value='Large';node('#detail-quantity').value='1';node('#detail-add').handlers.click();assert.equal(run('basket.length'),2);
run("openProduct('custom-ice')");node('#detail-portion').value='2 scoops';node('#detail-quantity').value='1';checked=[{value:'Vanilla'},{value:'Mango'},{value:'Chocolate'}];node('#detail-add').handlers.click();assert.equal(run('basket.length'),2);assert(node('#detail-error').textContent);
checked=[{value:'Vanilla'},{value:'Mango'}];node('#detail-add').handlers.click();assert.equal(run('basket.length'),3);
run("openProduct('custom-ice')");node('#detail-portion').value='Custom scoops';node('#detail-scoop-count').value='13';node('#detail-quantity').value='1';checked=[{value:'Vanilla'}];node('#detail-add').handlers.click();assert.equal(run('basket.length'),4);assert.equal(run("basket[3].customScoops"),13);
run("openProduct('mango')");node('#detail-portion').value='Full box – 4 litres';node('#detail-portion').handlers.change();assert(node('#detail-image').src.includes('four-litre-box.jpg'));assert(node('#detail-image').alt.includes('4 litre sharing box'));node('#detail-portion').value='1 scoop';node('#detail-portion').handlers.change();assert(node('#detail-image').src.includes('mango.jpg'));node('#detail-portion').value='Full box – 4 litres';node('#detail-portion').handlers.change();node('#detail-quantity').value='1';node('#detail-add').handlers.click();assert.equal(run('basket.length'),5);
run("openProduct('custom-smoothie')");node('#detail-portion').value='Medium';node('#detail-quantity').value='1';checked=[{value:'Banana'},{value:'Cocoa'}];node('#detail-add').handlers.click();assert.equal(run('basket.length'),6);
assert.equal(run("validLine({id:'mango',portion:'Free',quantity:1,flavors:[]})"),false);
assert.equal(run("validLine({id:'mango',portion:'1 scoop',quantity:-1,flavors:[]})"),false);
assert.equal(JSON.parse(storage['chillos-order-v2']).length,6);
node('#customer-name').value='Test';node('#customer-phone').value='0781234567';node('#fulfillment').value='Delivery';node('#fulfillment').handlers.change();assert.equal(node('#address').required,true);node('#address').value='Kigali test address';submitOrder();
const message=new URL(destination).searchParams.get('text');assert(message.includes('2 × Orange juice — Small'));assert(message.includes('1 × Orange juice — Large'));assert(message.includes('2 scoops — Mango + Vanilla'));assert(message.includes('Medium — Banana + Cocoa'));assert(!message.includes('RWF'));
const assets=JSON.parse(run('JSON.stringify([...new Set(products.map(p=>p.image))])'));
for(const image of assets)assert(fs.existsSync('assets/generated/'+image+'.jpg'),'Missing '+image);
for(const [,file] of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!/^(https:|tel:)/.test(file))assert(fs.existsSync(file.split('?')[0]),file);
// Different custom scoop counts must survive adding, saving and checkout.
run("openProduct('custom-ice')");node('#detail-portion').value='Custom scoops';node('#detail-quantity').value='1';checked=[{value:'Vanilla'}];
node('#detail-scoop-count').value='14';node('#detail-add').handlers.click();
assert.equal(run('basket.length'),7);
node('#detail-scoop-count').value='13';node('#detail-add').handlers.click();
assert.equal(run('basket.length'),7);assert.equal(run('basket[3].quantity'),2);
for(const count of ['12','100','13.5','']) {
  node('#detail-scoop-count').value=count;node('#detail-add').handlers.click();
  assert.equal(run('basket.length'),7);assert.match(node('#detail-error').textContent,/13 to 99/);
}
for(const invalid of [null,{}, {id:'custom-ice',portion:'2 scoops',quantity:1,flavors:['Vanilla','Vanilla']}, {id:'mango',portion:'1 scoop',quantity:1,flavors:['Chocolate']}]) {
  assert.equal(run(`validLine(${JSON.stringify(invalid)})`),false);
}
run("basket=JSON.parse(localStorage.getItem('chillos-order-v2')).filter(validLine);renderBasket()");
assert.equal(run('basket.length'),7);
submitOrder();
const customMessage=new URL(destination).searchParams.get('text');
assert(customMessage.includes('2 × Create your scoop mix — 13 custom scoops'));
assert(customMessage.includes('1 × Create your scoop mix — 14 custom scoops'));
for(const phone of ['abc0781234567','12345678','1234567890123456']) {
  destination=undefined;node('#customer-phone').value=phone;submitOrder();
  assert.equal(destination,undefined);assert(node('#order-error').textContent);
}
node('#customer-phone').value='+250 781 234 567';node('#address').value='   ';destination=undefined;
submitOrder();assert.equal(destination,undefined);
node('#fulfillment').value='Pickup';node('#fulfillment').handlers.change();assert.equal(node('#address').required,false);
submitOrder();assert(destination);assert.equal(node('#order-error').textContent,'');
assert(!new URL(destination).searchParams.get('text').includes('Delivery details:'));
// New storefront shortcuts and reversible basket clearing.
const savedOrder=run('JSON.stringify(basket)');
node('#clear-order').handlers.click();
assert.equal(run('basket.length'),0);assert.equal(node('#order-form').hidden,true);
assert.equal(node('#empty-browse').hidden,false);assert.equal(node('#undo-clear').hidden,false);
assert.equal(storage['chillos-order-v2'],'[]');
node('#undo-clear').handlers.click();
assert.equal(run('JSON.stringify(basket)'),savedOrder);assert.equal(node('#order-form').hidden,false);
assert.equal(node('#empty-browse').hidden,true);assert.equal(node('#undo-clear').hidden,true);
node('#undo-clear').handlers.click();assert.equal(run('JSON.stringify(basket)'),savedOrder);
listeners.click({target:{closest:selector=>selector==='[data-detail]'?{dataset:{detail:'custom-ice',portion:'Full box – 4 litres'}}:null}});
assert.equal(node('#detail-portion').value,'Full box – 4 litres');
assert(node('#detail-image').src.includes('four-litre-box.jpg'));
assert(node('#mix-hint').textContent.includes('4 litre box'));
// Editing replaces rather than duplicates, validates before mutation, and merges matching lines.
run("basket=[{id:'orange-juice',portion:'Small',quantity:2,flavors:[]},{id:'orange-juice',portion:'Large',quantity:1,flavors:[]}];renderBasket();editSelection(0)");
assert.equal(node('#detail-quantity').value,'2');assert.equal(node('#detail-portion').value,'Small');
node('#detail-quantity').value='0';node('#detail-add').handlers.click();assert.equal(run('basket[0].quantity'),2);
node('#detail-quantity').value='3';node('#detail-portion').value='Medium';node('#detail-add').handlers.click();
assert.equal(run('basket.length'),2);assert.equal(run('basket[0].portion'),'Medium');assert.equal(run('basket[0].quantity'),3);
run('editSelection(0)');node('#detail-portion').value='Large';node('#detail-add').handlers.click();
assert.equal(run('basket.length'),1);assert.equal(run('basket[0].quantity'),4);
run("basket=[{id:'orange-juice',portion:'Small',quantity:2,flavors:[]},{id:'orange-juice',portion:'Large',quantity:99,flavors:[]}];editSelection(0)");
node('#detail-portion').value='Large';node('#detail-add').handlers.click();assert.equal(run('basket.length'),2);assert.equal(run('basket[0].portion'),'Small');
run("openProduct('mango')");assert.equal(node('#detail-add').textContent,'Add to order');
node('#fulfillment').value='Pickup';node('#fulfillment').handlers.change();node('#pickup-branch').value='Kicukiro';node('#preferred-time').value='Saturday at 3 pm';
submitOrder();
assert(new URL(destination).searchParams.get('text').includes('Pickup branch: Kicukiro'));
assert(new URL(destination).searchParams.get('text').includes('Saturday at 3 pm'));
node('#fulfillment').value='Delivery';node('#address').value='Kigali';node('#fulfillment').handlers.change();
assert.equal(node('#pickup-label').hidden,true);assert.equal(node('#pickup-branch').disabled,true);
submitOrder();assert(!new URL(destination).searchParams.get('text').includes('Pickup branch:'));
// A party enquiry is independent of the basket and includes event preferences.
const beforeParty=run('JSON.stringify(basket)');
node('#party-name').value='Party test';node('#party-guests').value='20';node('#party-date').value='2099-12-25';
node('#party-occasion').value='Birthday';node('#party-time').value='15:00';node('#party-method').value='Pickup - Kicukiro';node('#party-notes').value='Vanilla; ask about nuts';
node('#party-form').handlers.submit({preventDefault(){}});
const partyMessage=new URL(destination).searchParams.get('text');
for(const value of ['Birthday','Guests: 20','2099-12-25','15:00','Pickup - Kicukiro','ask about nuts','not a confirmed booking'])assert(partyMessage.includes(value));
assert.equal(run('JSON.stringify(basket)'),beforeParty);
for(const guests of ['0','1.5','10001']){destination=undefined;node('#party-guests').value=guests;node('#party-form').handlers.submit({preventDefault(){}});assert.equal(destination,undefined);assert(node('#party-error').textContent);}
node('#party-guests').value='20';node('#party-date').value='2000-01-01';destination=undefined;
node('#party-form').handlers.submit({preventDefault(){}});assert.equal(destination,undefined);

// Review waits for an explicit send; saved details require consent.
node('#customer-name').value='Private Customer';node('#customer-phone').value='0781234567';node('#address').value='Private Address';node('#notes').value='Private Notes';destination=undefined;
node('#order-form').handlers.submit({preventDefault(){}});assert.equal(destination,undefined);assert(node('#order-review-text').textContent.includes('Private Customer'));assert.equal(storage['chillos-customer-v1'],undefined);
node('#review-back').handlers.click();node('#review-send').handlers.click();assert.equal(destination,undefined);
node('#remember-customer').checked=true;node('#order-form').handlers.submit({preventDefault(){}});
const remembered=JSON.parse(storage['chillos-customer-v1']);assert.equal(remembered['customer-name'],'Private Customer');assert.equal(remembered.address,'Private Address');assert(!JSON.stringify(remembered).includes('Private Notes'));
node('#forget-customer').handlers.click();assert.equal(storage['chillos-customer-v1'],undefined);assert.equal(node('#remember-customer').checked,false);assert.equal(node('#customer-name').value,'Private Customer');
node('#remember-customer').checked=true;run('saveCustomer()');node('#remember-customer').checked=false;node('#remember-customer').handlers.change();assert.equal(storage['chillos-customer-v1'],undefined);
// Sharing excludes checkout fields and guards against empty selections.
node('#share-selection').handlers.click();const share=node('#share-text').value;assert(share.includes('Orange juice'));for(const secret of ['Private Customer','0781234567','Private Address','Private Notes'])assert(!share.includes(secret));assert.equal(node('#share-native').hidden,true);
const preserveBasket=run('JSON.stringify(basket)');run('basket=[]');node('#share-selection').handlers.click();assert(node('#basket-feedback').textContent.includes('Choose a treat'));run('basket='+preserveBasket);
// Date boundaries are inclusive and unknown products are omitted.
run("menuHighlights.push({id:'mango',label:'Seasonal',starts:'2099-01-01',ends:'2099-01-31'})");
assert.equal(run("activeHighlights('2098-12-31').some(p=>p.label==='Seasonal')"),false);assert.equal(run("activeHighlights('2099-01-01').some(p=>p.label==='Seasonal')"),true);assert.equal(run("activeHighlights('2099-01-31').some(p=>p.label==='Seasonal')"),true);assert.equal(run("activeHighlights('2099-02-01').some(p=>p.label==='Seasonal')"),false);
run("menuHighlights.push({id:'missing',label:'Invalid'})");assert.equal(run("activeHighlights().some(p=>p.id==='missing')"),false);
const originalSet=context.localStorage.setItem;context.localStorage.setItem=()=>{throw new Error('blocked')};node('#remember-customer').checked=true;destination=undefined;node('#order-form').handlers.submit({preventDefault(){}});assert(node('#remember-status').textContent.includes('could not save'));assert.equal(destination,undefined);context.localStorage.setItem=originalSet;

// Repeat selections are reviewed first, merged safely and never sent automatically.
run("basket=[{id:'mango',portion:'1 scoop',quantity:2,flavors:[],privateNote:'never save this'}];saveLastSelection()");
assert(!storage['chillos-last-selection-v1'].includes('privateNote'));
assert.equal(node('#reorder-panel').hidden,false);destination=undefined;
run("basket=[{id:'orange-juice',portion:'Small',quantity:1,flavors:[]}]");
node('#order-again').handlers.click();assert.equal(run('basket.length'),1);assert.equal(destination,undefined);assert(node('#reorder-items').innerHTML.includes('Mango'));
node('#reorder-cancel').handlers.click();assert.equal(run('basket.length'),1);
node('#order-again').handlers.click();node('#reorder-add').handlers.click();assert.equal(run('basket.length'),2);assert.equal(run('basket[1].quantity'),2);assert.equal(destination,undefined);
node('#reorder-add').handlers.click();assert.equal(run('basket[1].quantity'),4);
run('basket[1].quantity=99');const beforeLimit=run('JSON.stringify(basket)');node('#reorder-add').handlers.click();assert.equal(run('JSON.stringify(basket)'),beforeLimit);assert(node('#reorder-error').textContent.includes('exceed 99'));
node('#forget-order').handlers.click();assert.equal(storage['chillos-last-selection-v1'],undefined);assert.equal(node('#reorder-panel').hidden,true);assert.equal(run('JSON.stringify(basket)'),beforeLimit);
assert.equal(run('cleanSelections([null,{}, {id:"missing"}]).length'),0);
run("toast('Mango added to your order',true)");assert.equal(node('#toast-view').hidden,false);assert.equal(node('#toast-message').textContent,'Mango added to your order');node('#toast-view').handlers.click();
assert(html.indexOf('id="menu"')<html.search(/class="[^"]*\bsharing-section\b/));assert(html.includes('class="checkout-options"'));assert(html.includes('class="gallery"'));assert(!html.includes('Cache-Control'));assert(html.includes('og:image" content="https:'));
// Instagram profile is linked prominently, opens safely in a new tab and is declared for search engines.
const igLinks=[...html.matchAll(/<a [^>]*href="https:\/\/www\.instagram\.com\/chillos\.ice\.cream\/"[^>]*>/g)].map(m=>m[0]);assert(igLinks.length>=4);for(const a of igLinks)assert(a.includes('target="_blank"')&&a.includes('rel="noopener"'),a);const xLinks=[...html.matchAll(/<a [^>]*href="https:\/\/x\.com\/ChillosIceCream"[^>]*>/g)].map(m=>m[0]);assert(xLinks.length>=4);for(const a of xLinks)assert(a.includes('target="_blank"')&&a.includes('rel="noopener"'),a);const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);assert.deepEqual(ld.sameAs,['https://www.facebook.com/profile.php?id=100070608721866','https://www.instagram.com/chillos.ice.cream/','https://x.com/ChillosIceCream']);const fbLinks=[...html.matchAll(/<a [^>]*href="https:\/\/www\.facebook\.com\/profile\.php\?id=100070608721866"[^>]*>/g)].map(m=>m[0]);assert(fbLinks.length>=4);for(const a of fbLinks)assert(a.includes('target="_blank"')&&a.includes('rel="noopener"'),a);JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
console.log('Passed: reorder privacy, preview/cancel, safe merge limits, actionable feedback, review, saved details, sharing, seasonal dates, basket editing, pickup, party enquiries, Facebook/Instagram/X links and assets.');
