import crypto from "crypto";
import { normalizeServerDevelopment } from "./devAuthority.js";

const MIN_COINS = -50000;
const GENRES = { arcade:.85, platformer:.95, rpg:1.28, strategy:1.18, puzzle:.88, horror:1.05, racing:1.03, fighting:1.07, simulator:1.15, "visual-novel":.92, roguelike:1.22, deckbuilder:1.1, survival:1.24, metroidvania:1.18, sandbox:1.35, "battle-royale":1.45, rhythm:1.02, party:.9, idle:.86, "tower-defense":1.05, "moba-lite":1.4, "city-builder":1.3, "detective-game":1, "sports-manager":1.17, "social-sim":1.08 };
const PLATFORMS = { micro_pc:{t:1,u:1,l:1}, pocket_play:{t:1.08,u:1.25,l:2}, game_station:{t:1.22,u:1.45,l:4}, smart_game:{t:1.35,u:1.62,l:7} };
const COMBOS = { "arcade:cyberpunk":"Great", "arcade:sport":"Great", "platformer:fantasy":"Great", "platformer:food":"Great", "rpg:fantasy":"Great", "rpg:cyberpunk":"Great", "rpg:medieval":"Great", "rpg:mythology":"Great", "strategy:space":"Great", "strategy:military":"Great", "puzzle:school":"Great", "puzzle:detective":"Great", "horror:zombie":"Great", "horror:space":"Great", "racing:sport":"Great", "simulator:office":"Great", "visual-novel:school":"Great", "visual-novel:dreams":"Great", "deckbuilder:fantasy":"Great", "survival:zombie":"Great", "survival:postapoc":"Great", "metroidvania:space":"Great", "sandbox:kaiju":"Great", "battle-royale:military":"Great", "rhythm:music":"Great", "party:food":"Great", "idle:office":"Great", "tower-defense:medieval":"Great", "tower-defense:kaiju":"Great", "moba-lite:mythology":"Great", "city-builder:space":"Great", "detective-game:detective":"Great", "sports-manager:sport":"Great", "social-sim:school":"Great", "social-sim:office":"Great" };
const CRITICS = ["Пиксель Сегодня", "Инди Радар", "Отчёт об ошибках", "Игровая неделя"];
const DEV_EVENT_IDS = ["team-burnout","ui-contrast","microtransaction-idea","community-poll","localization-gap","balance-drama","boss-cameo","testers-love","legal-name","publisher-call","crash-on-ios","meme-title","feature-flag","data-loss-rumor","speedrun-scene","tutorial-skip","boss-fight","store-art","qa-night","trend-shift","designer-duel","analytics-ping","combat-juice","chat-stickers","database-cleanup","streamer-feedback","pricing-debate","ai-voice","festival-slot","achievement-bug","modding-request","accessibility","boss-micromanage","mystery-influencer","economy-exploit","mobile-heat","npc-dialogue"];
const STAR_COSTS = { skip:15, promote:35 };
const MAX_DEVELOPMENT_SECONDS = 20 * 72;

function isObj(v){ return Boolean(v && typeof v === "object" && !Array.isArray(v)); }
function arr(v){ return Array.isArray(v) ? v : []; }
function n(v,min=0,max=Number.MAX_SAFE_INTEGER){ const x=Number(v); return Math.min(max,Math.max(min,Number.isFinite(x)?x:min)); }
function i(v,min=0,max=Number.MAX_SAFE_INTEGER){ return Math.floor(n(v,min,max)); }
function id(){ return `${Date.now().toString(36)}-${crypto.randomUUID().slice(0,8)}`; }
function clean(s,f="Новая игра"){ return String(s||f).replace(/[<>"'`]/g,"").replace(/\s+/g," ").trim().slice(0,28)||f; }
function has(data,key){ return arr(data?.unlockedResearchIds).includes(key); }
function combo(g,t){ return COMBOS[`${g}:${t}`] || "Neutral"; }
function comboMul(c){ return c==="Great"?1.27:c==="Good"?1.11:c==="Bad"?.76:1; }
function speed(data){
  const emp=arr(data?.employees).reduce((s,e)=>s+(Number(e?.speedBoost)||0),0);
  const research=(has(data,"fast-prototype")?.1:0)+(has(data,"engine-v2")?.15:0)+(has(data,"ai-assist")?.12:0);
  const synergy=has(data,"team-synergy")?arr(data?.employees).length*.025:0;
  const release=Math.min(.32,Math.log1p(Math.max(0,Number(data?.gamesReleased)||0))*.045);
  const level=Math.max(0,i(data?.level,1,4)-1)*.07;
  const momentum=1+n((Number(data?.studioXp)||0)/1200,0,1)*.25;
  return n((1+emp+research+synergy+release+level)*momentum,.55,3.75);
}
function income(data){
  const emp=arr(data?.employees).reduce((s,e)=>s+(Number(e?.incomeBoost)||0),0);
  const research=(has(data,"pixel-polish")?.05:0)+(has(data,"community-posts")?.07:0)+(has(data,"micro-influencers")?.1:0)+(has(data,"service-model")?.08:0);
  return n(1+emp+research,.55,4.5);
}
function science(data){ return n(1+arr(data?.employees).reduce((s,e)=>s+(Number(e?.scienceBoost)||0),0),.75,2.2); }
function teamScore(data){ return n(arr(data?.employees).reduce((s,e)=>s+(Number(e?.scoreBoost)||0),0),-.35,.9); }
function releaseNumber(data){ return Math.max(1,i(data?.gamesReleased,0)+1); }
function durationForRelease(release){ if(release<=1)return 5; if(release===2)return 30; if(release===3)return 60; const steps=[180,300,600,900,1200,MAX_DEVELOPMENT_SECONDS]; return Math.min(MAX_DEVELOPMENT_SECONDS,steps[Math.min(steps.length-1,release-4)]||MAX_DEVELOPMENT_SECONDS); }
function duration(project,data){ return Math.min(MAX_DEVELOPMENT_SECONDS,durationForRelease(releaseNumber(data))); }
function cost(project,data){
  if(project.isTutorial)return 0;
  const tech=["engine-v2","sound-lab","liveops-lite","ai-assist","data-warehouse"].filter(x=>has(data,x)).length;
  const raw=360+(duration(project,data)/10)*28+(GENRES[project.genre]||1)*260+(PLATFORMS[project.platform]?.t||1)*280+tech*95;
  return Math.round(raw*(has(data,"budget-ops")?.9:1)*(has(data,"reusable-tech")?.92:1));
}
function startedAt(project,data,progress,now=Date.now()){ return Math.max(0,Math.round(now-(n(progress,0,100)/100)*Math.max(1,Number(project.durationSeconds)||180)*1000/Math.max(.1,speed(data)))); }
function ledger(data,title,amount,kind){ return [...arr(data?.lastLedger),{id:id(),day:i(data?.gameDay,1),title,amount,kind}].slice(-10); }
function normalize(data){ return normalizeServerDevelopment(isObj(data)?data:{}); }
function projectOf(data){ if(!isObj(data?.selectedProject)) throw Object.assign(new Error("missing_project"),{status:400,code:"missing_project"}); return data.selectedProject; }
function eventCountForRelease(data){ const r=releaseNumber(data); if(r<=1)return 0; if(r===2)return 1; if(r===3)return 3; if(r<=5)return 2; if(r<=7)return 3; if(r<=9)return 4; return i(1+Math.random()*5,1,5); }
function devQueue(data){
  const count=eventCountForRelease(data);
  if(count<=0)return [];
  const ids=[...DEV_EVENT_IDS];
  for(let x=ids.length-1;x>0;x-=1){ const y=i(Math.random()*(x+1),0,x); const tmp=ids[x]; ids[x]=ids[y]; ids[y]=tmp; }
  const safe=Math.min(count,ids.length);
  const queue=[];
  for(let index=0;index<safe;index+=1){ const min=16+Math.floor(index*70/safe); const max=Math.min(90,min+Math.max(10,Math.floor(58/safe))); const progressAt=i(min+Math.random()*(max-min+1),12,92); queue.push({instanceId:id(),scenarioId:ids[index],progressAt,triggered:false}); }
  return queue.sort((a,b)=>a.progressAt-b.progressAt);
}
function actionError(code,status=409){ return Object.assign(new Error(code),{status,code}); }

export function startDevelopmentAction(saveData,draft){
  const data=normalize(saveData);
  if(isObj(data.selectedProject)&&data.selectedProject.startedAt) throw actionError("active_project_exists",409);
  const src=isObj(draft)?draft:data.selectedProject;
  if(!isObj(src)) throw actionError("missing_project",400);
  const genre=String(src.genre||""), theme=String(src.theme||""), platform=String(src.platform||"micro_pc");
  if(!GENRES[genre]||!theme||!PLATFORMS[platform]) throw actionError("invalid_project_choices",400);
  if(PLATFORMS[platform].l>i(data.level,1,4)) throw actionError("platform_locked",403);
  const p={...src,id:String(src.id||id()).slice(0,64),name:clean(src.name),genre,theme,platform,isTutorial:Boolean(src.isTutorial&&!data.tutorialDone)};
  const durationSeconds=duration(p,data), devCost=cost({...p,durationSeconds},data);
  if((Number(data.coins)||0)-devCost<MIN_COINS) throw actionError("not_enough_coins",402);
  const now=Date.now();
  return normalize({...data,coins:(Number(data.coins)||0)-devCost,screen:"develop",tutorialStep:data.tutorialDone?data.tutorialStep:4,selectedProject:{...p,durationSeconds,devCost,techComplexity:PLATFORMS[platform].t+(has(data,"engine-v2")?.25:0)+(has(data,"ai-assist")?.18:0),startedAt:now,progress:Math.max(1,Number(p.progress)||0),promotionUsed:false,promotionBoost:0,devGlitchTriggered:false,devEventQueue:devQueue(data),pendingDevEvent:null,devDecisionScoreBonus:0,devDecisionSalesMultiplier:1,devDecisionLog:[],serverActionAt:now},lastLedger:devCost>0?ledger(data,`Старт разработки: ${clean(p.name)}`,-devCost,"expense"):data.lastLedger,lastSavedAt:now});
}

export function skipDevelopmentAction(saveData){
  const data=normalize(saveData), p=projectOf(data);
  if(!p.startedAt||p.progress>=100||p.pendingDevEvent) throw actionError("skip_not_available");
  const progress=n((Number(p.progress)||0)+25,0,100);
  return normalize({...data,selectedProject:{...p,progress,startedAt:startedAt(p,data,progress),devEventId:id(),devEventText:"УСКОРЕНИЕ +25%",devEventTone:"normal",serverActionAt:Date.now()},lastSavedAt:Date.now()});
}

export function promoteDevelopmentAction(saveData){
  const data=normalize(saveData), p=projectOf(data);
  if(!p.startedAt||p.progress<100||p.promotionUsed) throw actionError("promotion_not_available");
  const boost=Number((.1+Math.random()*1.1).toFixed(1));
  return normalize({...data,selectedProject:{...p,promotionUsed:true,promotionBoost:boost,devEventId:id(),devEventText:`ПРОМО +${boost.toFixed(1)}`,devEventTone:"normal",serverActionAt:Date.now()},lastSavedAt:Date.now()});
}

export function resolveDevelopmentEventAction(saveData,choiceId){
  const data=normalize(saveData), p=projectOf(data);
  if(!p.startedAt||!isObj(p.pendingDevEvent)) throw actionError("missing_pending_event");
  const positive=String(choiceId)==="a";
  const effect=positive?{coins:-450,score:.18,salesMultiplier:1.06,progress:-2}:{coins:180,score:-.1,salesMultiplier:.98,progress:2};
  const progress=n((Number(p.progress)||0)+(effect.progress||0),0,99);
  return normalize({...data,coins:n((Number(data.coins)||0)+effect.coins,MIN_COINS),dailyWorkTaps:i(data.dailyWorkTaps,0)+1,selectedProject:{...p,progress,startedAt:startedAt(p,data,progress),pendingDevEvent:null,devDecisionScoreBonus:n((Number(p.devDecisionScoreBonus)||0)+effect.score,-2,2),devDecisionSalesMultiplier:n((Number(p.devDecisionSalesMultiplier)||1)*effect.salesMultiplier,.55,1.85),devDecisionLog:[`Серверное решение: ${positive?"полировка":"экономия"}`,...arr(p.devDecisionLog)].slice(0,4),devEventId:id(),devEventText:"РЕШЕНИЕ!",devEventTone:positive?"normal":"danger",serverActionAt:Date.now()},lastLedger:ledger(data,"Решение разработки",effect.coins,effect.coins>0?"income":"expense"),lastSavedAt:Date.now()});
}

export function releaseDevelopmentAction(saveData){
  const data=normalize(saveData), p=projectOf(data);
  if(!p.startedAt||!p.genre||!p.theme||!p.platform||p.progress<100) throw actionError("release_not_available");
  const c=combo(p.genre,p.theme), base=4.9+(comboMul(c)-1)*1.75, random=Math.random()*2.1-1.05;
  const research=(has(data,"qa-checklist")?.24:0)+(has(data,"game-feel")?.3:0)+(has(data,"sound-lab")?.16:0);
  const score=Number(n(base+teamScore(data)+research+n(p.promotionBoost,0,1.2)+n(p.devDecisionScoreBonus,-2,2)+random,1,10).toFixed(1));
  const platform=PLATFORMS[p.platform]||PLATFORMS.micro_pc, decision=n(p.devDecisionSalesMultiplier||1,.55,1.85);
  const sales=Math.round((p.isTutorial?1000:1500)*(.48+score/8.7)*comboMul(c)*platform.u*income(data)*(score>8?1+Math.pow((score-8)/2,1.35)*1.8:1)*decision);
  const rp=Math.max(5,Math.round(score*(p.isTutorial?1:1.45)*science(data)));
  const tutorial=Boolean(p.isTutorial&&!data.tutorialRewardClaimed), bonusCoins=tutorial?1200:0, bonusRp=tutorial?15:0, bonusStars=tutorial?1:0;
  const life=i(5+Math.random()*25,5,30), passive=Math.max(20,Math.round(((sales+bonusCoins)/life)*(.22+score/34)*(has(data,"service-model")?1.15:1)));
  const critics=CRITICS.map(name=>({name,score:Number(n(score+Math.random()*2.2-1.1,1,10).toFixed(1)),quote:"у проекта есть свой голос"}));
  const result={projectName:clean(p.name),score,critics,criticAverage:Number((critics.reduce((s,x)=>s+x.score,0)/critics.length).toFixed(1)),scoreBreakdown:[{label:"Серверное качество",value:base,kind:"base"},{label:`Комбо ${c}`,value:(comboMul(c)-1)*1.75,kind:c==="Bad"?"penalty":"bonus"},{label:"Команда студии",value:teamScore(data),kind:teamScore(data)>=0?"bonus":"penalty"},{label:"Исследования",value:research,kind:"bonus"},{label:"Продвижение",value:n(p.promotionBoost,0,1.2),kind:"bonus"},{label:"Решения разработки",value:n(p.devDecisionScoreBonus,-2,2),kind:"bonus"},{label:"Непредсказуемость прессы",value:random,kind:"random"}],sales:sales+bonusCoins,passivePerDay:passive,lifetimeDays:life,rp:rp+bonusRp,stars:bonusStars,promotionBoost:n(p.promotionBoost,0,1.2),bonusRewards:tutorial?["Бонус за туториал: +1 200 🪙","Бонус за туториал: +15 🧪","Бонус за туториал: +1 ⭐"]:[],combo:c,qualityLabel:score>=9?"Хит!":score>=7.5?"Сильный релиз":score>=6?"Ок для MVP":"Нужно полировать",createdAt:Date.now()};
  const activeGame={id:id(),title:clean(p.name),genre:p.genre,theme:p.theme,score,popularity:n(.62+score/10+(c==="Great"?.16:c==="Bad"?-.16:0),.35,1.9),baseDailyIncome:passive,lifeDaysRemaining:life,maxLifeDays:life,totalEarned:0,lastEvent:"Релиз свежий: аудитория только учится на игре.",createdGameDay:i(data.gameDay,1)};
  return normalize({...data,coins:(Number(data.coins)||0)+sales+bonusCoins,rp:(Number(data.rp)||0)+rp+bonusRp,stars:(Number(data.stars)||0)+bonusStars,studioXp:i(data.studioXp,0)+Math.round(score*12+sales/180),gamesReleased:i(data.gamesReleased,0)+1,dailyGamesReleased:i(data.dailyGamesReleased,0)+1,bestScore:Math.max(Number(data.bestScore)||0,score),latestRelease:result,selectedProject:null,activeGames:[activeGame,...arr(data.activeGames)].slice(0,12),releaseHistory:[...arr(data.releaseHistory),{title:clean(p.name),genre:p.genre,theme:p.theme,score,day:i(data.gameDay,1)}].slice(-16),tutorialDone:Boolean(data.tutorialDone||p.isTutorial),tutorialRewardClaimed:Boolean(data.tutorialRewardClaimed||tutorial),tutorialStep:p.isTutorial?5:data.tutorialStep,screen:"develop",lastLedger:ledger(data,`Релиз: ${clean(p.name)}`,sales+bonusCoins,"income"),lastSavedAt:Date.now()});
}

export const DEVELOPMENT_ACTION_STAR_COSTS = STAR_COSTS;