import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context={};vm.runInNewContext(readFileSync(new URL('../stories/js/text-fit.js',import.meta.url),'utf8'),context);
const segmenter=new Intl.Segmenter('ko',{granularity:'grapheme'});
const chars=text=>Array.from(segmenter.segment(text),p=>p.segment);
// Independent sequential reference: the former DOM algorithm, with a line-height
// model that exercises word boundaries, spaces, grapheme clusters and quotes.
function height(text,width){let rows=1,col=0;for(const c of chars(text)){if(c==='\n'){rows++;col=0;continue;}const advance=/[A-Za-z0-9 .,]/.test(c)?.55:1;if(col+advance>width){rows++;col=0;}col+=advance;}return rows*24;}
function oldFit(source,width,allowed,quote=''){let text=source;if(height(quote+text+quote,width)<=allowed)return text;let c=chars(source),low=0,high=c.length;while(low<high){let mid=Math.ceil((low+high)/2);text=c.slice(0,mid).join('').trimEnd()+'⋯';if(height(quote+text+quote,width)<=allowed)low=mid;else high=mid-1;}return c.slice(0,low).join('').trimEnd()+'⋯';}
test('batched search is byte-identical to sequential fitting for CJK, quotes, emoji and boundary whitespace',()=>{
 const entries=[];for(const text of ['짧은 글','가나다라마바사 '.repeat(12),'Words and numbers 123 '.repeat(18),'👩‍👩‍👧‍👦 é 🇰🇷 '.repeat(20),'첫 문단\n다음 문단과 끝 공백  '.repeat(8)])for(const width of [4,8,13,25])for(const lines of [1,2,5])for(const quote of ['','“']){let value=text;entries.push({source:text,allowed:lines*24+.5,characters:()=>chars(text),write:v=>{value=v},height:()=>height(quote+value+quote,width),actual:()=>value,expected:oldFit(text,width,lines*24+.5,quote)});}
 context.StoryTextFit(entries);entries.forEach(e=>assert.equal(e.actual(),e.expected));
});
test('layout flushes grow with search depth rather than the number of cards',()=>{
 let dirty=false,flushes=0;let entries=Array.from({length:248},(_,i)=>{let value='';let source='긴 한글 요약과 영문 text '.repeat(40+i%5);return{source,allowed:48,characters:()=>chars(source),write:t=>{if(value!==t){value=t;dirty=true}},height:()=>{if(dirty){flushes++;dirty=false}return height(value,20)}}});
 context.StoryTextFit(entries);assert.ok(flushes<20,`${flushes} flushes for248 cards`);
});
test('a later wider measurement restores original text and empty batches do no work',()=>{
 let value='';let source='확대하면 원문 전체가 돌아옵니다';let width=3;let item=()=>({source,allowed:48,characters:()=>chars(source),write:v=>{value=v},height:()=>height(value,width)});
 context.StoryTextFit([item()]);assert.ok(value.endsWith('⋯'));width=100;context.StoryTextFit([item()]);assert.equal(value,source);context.StoryTextFit([]);
});
