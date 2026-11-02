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
const context={document:{querySelector:node,querySelectorAll:s=>s==='#flavor-options input:checked'?checked:[],addEventListener:(type,fn)=>listeners[type]=fn,body:{classList:{add(){},remove(){}}}},localStorage:{getItem:key=>storage[key]||null,setItem:(key,val)=>storage[key]=val},window:{location:{assign:url=>destination=url}},setTimeout:()=>0,clearTimeout(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync('catalog.js','utf8')+'\n'+fs.readFileSync('script.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
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
node('#customer-name').value='Test';node('#customer-phone').value='0781234567';node('#fulfillment').value='Delivery';node('#fulfillment').handlers.change();assert.equal(node('#address').required,true);node('#address').value='Kigali test address';node('#order-form').handlers.submit({preventDefault(){}});
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
node('#order-form').handlers.submit({preventDefault(){}});
const customMessage=new URL(destination).searchParams.get('text');
assert(customMessage.includes('2 × Create your scoop mix — 13 custom scoops'));
assert(customMessage.includes('1 × Create your scoop mix — 14 custom scoops'));
for(const phone of ['abc0781234567','12345678','1234567890123456']) {
  destination=undefined;node('#customer-phone').value=phone;node('#order-form').handlers.submit({preventDefault(){}});
  assert.equal(destination,undefined);assert(node('#order-error').textContent);
}
node('#customer-phone').value='+250 781 234 567';node('#address').value='   ';destination=undefined;
node('#order-form').handlers.submit({preventDefault(){}});assert.equal(destination,undefined);
node('#fulfillment').value='Pickup';node('#fulfillment').handlers.change();assert.equal(node('#address').required,false);
node('#order-form').handlers.submit({preventDefault(){}});assert(destination);assert.equal(node('#order-error').textContent,'');
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
console.log('Passed: sharing-box shortcut, clear/undo order, empty-basket flow,  catalog, search, filtering, distinct portions and custom scoop counts, flavor validation, quantity limits, storage round-trip, checkout validation, WhatsApp contents, assets and synchronized HTML.');

