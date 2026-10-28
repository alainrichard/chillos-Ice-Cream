'use strict';
// Flavor ideas are requestable; the shop confirms daily availability and ingredients.
const flavorOptions = {
  ice: ['Vanilla','Chocolate','Strawberry','Mango','Mint','Pistachio','Cookies & cream','Salted caramel','Coffee','Coconut','Banana','Blueberry','Raspberry','Lemon','Passion fruit','Hazelnut','Peanut butter','White chocolate','Chocolate chip','Butter pecan'],
  juices: ['Orange','Mango','Pineapple','Passion fruit','Watermelon','Apple','Lemon','Lime','Cucumber','Carrot','Beetroot','Ginger','Papaya','Guava','Tree tomato'],
  smoothies: ['Strawberry','Banana','Mango','Pineapple','Blueberry','Raspberry','Avocado','Passion fruit','Coconut','Papaya','Peach','Cocoa','Peanut butter','Oats','Vanilla']
};
const portions = { ice:['1 scoop','2 scoops','3 scoops','4 scoops','5 scoops','6 scoops','7 scoops','8 scoops','9 scoops','10 scoops','11 scoops','12 scoops','Custom scoops','Full box – 4 litres'], juices:['Small','Medium','Large'], smoothies:['Small','Medium','Large'] };
const catalogRows = [
 ['mango','Mango','ice','mango','Tropical, bright and full of sunshine.'],
 ['strawberry','Strawberry','ice','strawberry','A berry-inspired favorite for a sweet little break.'],
 ['vanilla','Vanilla','ice','vanilla','A timeless classic, lovely alone or in a mix.'],
 ['chocolate','Chocolate','ice','chocolate','A rich chocolate moment in every scoop.'],
 ['mint','Mint','ice','mint','A cool, refreshing flavor idea.'],
 ['pistachio','Pistachio','ice','pistachio','A nutty-inspired scoop for a different kind of treat.'],
 ['cookies','Cookies & cream','ice','cookies-cream','A classic cookie-inspired combination.'],
 ['caramel','Salted caramel','ice','caramel','Sweet caramel with a savory twist.'],
 ['berry-duo','Strawberry + blueberry','ice','berry-mix','Two berry favorites, one colorful combination.'],
 ['tropical-duo','Mango + coconut','ice','tropical-mix','A sunny combination with a tropical feel.'],
 ['choc-vanilla','Chocolate + vanilla','ice','soft-serve','Two classics that belong together.'],
 ['custom-ice','Create your scoop mix','ice','hero','Explore coffee, hazelnut, lemon, raspberry and more. Pick your combination.'],
 ['orange-juice','Orange juice','juices','fresh-juice','A citrus-inspired refreshment for your day.'],
 ['pineapple-juice','Pineapple juice','juices','pineapple-juice','A bright tropical juice choice.'],
 ['watermelon-juice','Watermelon juice','juices','watermelon-juice','A refreshing watermelon-inspired sip.'],
 ['passion-juice','Passion fruit juice','juices','passion-juice','A tangy tropical favorite to request.'],
 ['mango-juice','Mango juice','juices','tropical-juice','A sunny mango drink, in your preferred size.'],
 ['green-juice','Apple + cucumber + lime','juices','green-juice','A crisp green combination to explore.'],
 ['tropical-juice','Mango + pineapple + passion','juices','tropical-juice','Three tropical flavors in one drink.'],
 ['citrus-juice','Orange + pineapple','juices','pineapple-juice','A cheerful blend of citrus and tropical fruit.'],
 ['custom-juice','Create your juice mix','juices','fresh-juice','Explore carrot, ginger, guava, papaya, tree tomato and more.'],
 ['strawberry-smoothie','Strawberry + banana','smoothies','smoothie','A fruity pairing with a smooth, mellow finish.'],
 ['mango-smoothie','Mango + banana','smoothies','mango-smoothie','A golden tropical blend to brighten your day.'],
 ['berry-smoothie','Mixed berry','smoothies','berry-smoothie','Strawberry, blueberry and raspberry inspiration.'],
 ['avocado-smoothie','Avocado + banana','smoothies','avocado-smoothie','A smooth green pairing for your next sip.'],
 ['chocolate-smoothie','Cocoa + banana','smoothies','chocolate-smoothie','A chocolate-inspired fruit blend.'],
 ['tropical-smoothie','Mango + pineapple','smoothies','mango-smoothie','A bright tropical pairing to request.'],
 ['coconut-smoothie','Banana + coconut','smoothies','mango-smoothie','A mellow tropical combination.'],
 ['passion-smoothie','Mango + passion fruit','smoothies','mango-smoothie','Sweet and tangy tropical inspiration.'],
 ['custom-smoothie','Create your smoothie mix','smoothies','berry-smoothie','Explore peach, papaya, oats, peanut butter and more.']
];
const products = catalogRows.map(([id,name,category,image,description]) => ({id,name,category,image,description,custom:id.startsWith('custom-')}));
