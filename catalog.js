'use strict';
// Menu items and flavour choices. The shop confirms daily availability and ingredients on WhatsApp.
const flavorOptions = {
  ice: ['Vanilla','Chocolate','Strawberry','Mango','Mint','Pistachio','Cookies & cream','Salted caramel','Coffee','Coconut','Banana','Blueberry','Raspberry','Lemon','Passion fruit','Hazelnut','Peanut butter','White chocolate','Chocolate chip','Butter pecan'],
  juices: ['Orange','Mango','Pineapple','Passion fruit','Watermelon','Apple','Lemon','Lime','Cucumber','Carrot','Beetroot','Ginger','Papaya','Guava','Tree tomato'],
  smoothies: ['Strawberry','Banana','Mango','Pineapple','Blueberry','Raspberry','Avocado','Passion fruit','Coconut','Papaya','Peach','Cocoa','Peanut butter','Oats','Vanilla']
};
const portions = { ice:['1 scoop','2 scoops','3 scoops','4 scoops','5 scoops','6 scoops','7 scoops','8 scoops','9 scoops','10 scoops','11 scoops','12 scoops','Custom scoops','Full box – 4 litres'], juices:['Small','Medium','Large'], smoothies:['Small','Medium','Large'] };
const catalogRows = [
 ['mango','Mango','ice','mango','Ripe, tropical mango in a smooth, sunny scoop.'],
 ['strawberry','Strawberry','ice','strawberry','Sweet strawberry, creamy and bright.'],
 ['vanilla','Vanilla','ice','vanilla','A timeless classic, lovely on its own or in a mix.'],
 ['chocolate','Chocolate','ice','chocolate','Rich, smooth chocolate in every scoop.'],
 ['mint','Mint','ice','mint','Cool, refreshing mint for a hot Kigali afternoon.'],
 ['pistachio','Pistachio','ice','pistachio','Nutty, delicate and a little different.'],
 ['cookies','Cookies & cream','ice','cookies-cream','Creamy vanilla packed with cookie pieces.'],
 ['caramel','Salted caramel','ice','caramel','Sweet caramel with a hint of salt.'],
 ['berry-duo','Strawberry + blueberry','ice','berry-mix','Strawberry and blueberry, side by side.'],
 ['tropical-duo','Mango + coconut','ice','tropical-mix','Mango and coconut for a taste of the tropics.'],
 ['choc-vanilla','Chocolate + vanilla','ice','soft-serve','Two classics that belong together.'],
 ['custom-ice','Create your scoop mix','ice','hero','Pick from 20 flavours, including coffee, hazelnut, lemon and raspberry.'],
 ['orange-juice','Orange juice','juices','fresh-juice','Fresh orange juice, bright and zesty.'],
 ['pineapple-juice','Pineapple juice','juices','pineapple-juice','Sweet, tangy pineapple, freshly prepared.'],
 ['watermelon-juice','Watermelon juice','juices','watermelon-juice','Light and refreshing watermelon.'],
 ['passion-juice','Passion fruit juice','juices','passion-juice','Tangy passion fruit, a tropical favourite.'],
 ['mango-juice','Mango juice','juices','tropical-juice','Smooth mango juice in your preferred size.'],
 ['green-juice','Apple + cucumber + lime','juices','green-juice','Apple, cucumber and lime for a crisp, clean taste.'],
 ['tropical-juice','Mango + pineapple + passion','juices','tropical-juice','Mango, pineapple and passion fruit in one glass.'],
 ['citrus-juice','Orange + pineapple','juices','pineapple-juice','Orange and pineapple, bright and sweet.'],
 ['custom-juice','Create your juice mix','juices','fresh-juice','Mix up to five fruits, including carrot, ginger, guava and tree tomato.'],
 ['strawberry-smoothie','Strawberry + banana','smoothies','smoothie','Strawberry and banana with a smooth, mellow finish.'],
 ['mango-smoothie','Mango + banana','smoothies','mango-smoothie','Mango and banana, golden and creamy.'],
 ['berry-smoothie','Mixed berry','smoothies','berry-smoothie','Strawberry, blueberry and raspberry blended together.'],
 ['avocado-smoothie','Avocado + banana','smoothies','avocado-smoothie','Avocado and banana, rich and velvety.'],
 ['chocolate-smoothie','Cocoa + banana','smoothies','chocolate-smoothie','Cocoa and banana for a chocolatey treat.'],
 ['tropical-smoothie','Mango + pineapple','smoothies','mango-smoothie','Mango and pineapple, bright and tropical.'],
 ['coconut-smoothie','Banana + coconut','smoothies','mango-smoothie','Banana and coconut, mellow and creamy.'],
 ['passion-smoothie','Mango + passion fruit','smoothies','mango-smoothie','Mango and passion fruit, sweet and tangy.'],
 ['custom-smoothie','Create your smoothie mix','smoothies','berry-smoothie','Blend up to five ingredients, including peach, papaya, oats and peanut butter.']
];
const products = catalogRows.map(([id,name,category,image,description]) => ({id,name,category,image,description,custom:id.startsWith('custom-')}));
