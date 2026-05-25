import React from "react";
import ReactDOM from "react-dom/client";
import { useState } from "react";

const POINTS_TABLE = {
  1: 200, 2: 175, 3: 150, 4: 130, 5: 110,
  6: 90, 7: 75, 8: 60, 9: 50, 10: 40,
  11: 30, 12: 20, 13: 10, 14: 5
};

const PLAYOFF_POINTS_TABLE = Object.fromEntries(
  Object.entries(POINTS_TABLE).map(([k,v]) => [k, v * 2])
);

const FINAL_HANDICAP = { 1:6, 2:5, 3:4, 4:3, 5:2, 6:1 };
const PRIZE_SPLIT = { 1: 0.60, 2: 0.30, 3: 0.10 };

const initialPlayers = [
  { id: 1,  name: "El Doctor",        results: [75, 60, 50, 30],  paid: [10,10,10,10], dailyWins: [0,10,0,0],  isPlayoff: [false,false,false,false] },
  { id: 2,  name: "Felipao",          results: [60, 70, 0,  0],   paid: [10,10,0, 0],  dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 3,  name: "Gio",              results: [50, 50, 87.5,67], paid: [10,10,10,10], dailyWins: [10,0,5,0],  isPlayoff: [false,false,false,false] },
  { id: 4,  name: "Diegolfa",         results: [50, 50, 0,  0],   paid: [10,10,0, 0],  dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 5,  name: "Felipe R",         results: [75, 0,  0,  0],   paid: [10,0, 0, 0],  dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 6,  name: "Ñaño",            results: [0,  50, 20, 0],   paid: [0, 10,10,0],  dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 7,  name: "Daniel B",         results: [0,  50, 0,  50],  paid: [10,0, 0,10],  dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 8,  name: "Garbimba Asesina", results: [30, 0,  30, 40],  paid: [10,0, 10,10], dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 9,  name: "Pistolas",         results: [0,  30, 0,  10],  paid: [0, 10,0, 10], dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 10, name: "Juanca",           results: [30, 0,  0,  1],   paid: [10,0, 0,10],  dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 11, name: "Paisa",            results: [10, 0,  40, 100], paid: [10,0, 10,10], dailyWins: [0,0, 0,10], isPlayoff: [false,false,false,false] },
  { id: 12, name: "Nayibe",           results: [0,  0,  0,  67],  paid: [0, 0, 0,10],  dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 13, name: "Fercho",           results: [0,  0,  0,  0],   paid: [0, 0, 0,0],   dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 14, name: "El Nene",          results: [0,  0,  87.5,20], paid: [0, 0, 10,10], dailyWins: [0,0, 5,0],  isPlayoff: [false,false,false,false] },
  { id: 15, name: "Yerri",            results: [0,  0,  0,  0],   paid: [0, 0, 0,0],   dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 16, name: "Juan Rory",        results: [0,  0,  60, 0],   paid: [0, 0, 10,0],  dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 17, name: "Chapo",            results: [0,  0,  0,  1],   paid: [0, 0, 0,10],  dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
  { id: 18, name: "Dani B",           results: [0,  0,  0,  0],   paid: [0, 0, 0,0],   dailyWins: [0,0, 0,0],  isPlayoff: [false,false,false,false] },
];

const trophyColors = ["#FFD700","#C0C0C0","#CD7F32"];
const trophyEmoji  = ["🥇","🥈","🥉"];

function calcTotalPoints(results, isPlayoff) {
  const scored = results.map((pts, i) => isPlayoff?.[i] ? pts * 2 : pts);
  return [...scored].sort((a,b)=>b-a).slice(0,8).reduce((a,b)=>a+b,0);
}
function calcPot(players) {
  return players.reduce((s,p)=>s+p.paid.reduce((a,b)=>a+b,0),0);
}

function AcarreosHoliCup() {
  const [players, setPlayers]               = useState(initialPlayers);
  const [activeTab, setActiveTab]           = useState("ranking");
  const [showAddDate, setShowAddDate]       = useState(false);
  const [newDateResults, setNewDateResults] = useState({});
  const [newDatePaid, setNewDatePaid]       = useState({});
  const [newDateWinner, setNewDateWinner]   = useState(null);
  const [newDateIsPlayoff, setNewDateIsPlayoff] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [finalScores, setFinalScores]       = useState({});
  const [finalClosed, setFinalClosed]       = useState(false);

  const ranked = [...players]
    .map(p=>({...p, total: calcTotalPoints(p.results, p.isPlayoff)}))
    .sort((a,b)=>b.total-a.total);

  let pos = 1;
  const withPos = ranked.map((p,i)=>{
    if(i>0 && ranked[i-1].total!==p.total) pos=i+1;
    return {...p, pos};
  });

  const pot          = calcPot(players);
  const datesPlayed  = players[0]?.results.length ?? 0;
  const qualified    = withPos.filter(p => p.results.filter(r=>r>0).length >= 6);
  const qualifiedCount = qualified.length;

  function handleAddDate(){
    const updated = players.map(p=>({
      ...p,
      results:   [...p.results,   parseInt(newDateResults[p.id]??'0')||0],
      paid:      [...p.paid,      newDatePaid[p.id]?10:0],
      dailyWins: [...p.dailyWins, newDateWinner===p.id?10:0],
      isPlayoff: [...(p.isPlayoff||[]), newDateIsPlayoff],
    }));
    setPlayers(updated);
    setNewDateResults({}); setNewDatePaid({}); setNewDateWinner(null);
    setNewDateIsPlayoff(false); setShowAddDate(false);
  }

  const finalResults = qualified
    .filter(p => finalScores[p.id] != null && finalScores[p.id] !== "")
    .map((p, i) => {
      const gross = Number(finalScores[p.id]);
      const hcp   = FINAL_HANDICAP[i+1] ?? 0;
      return { ...p, gross, hcp, net: gross - hcp };
    })
    .sort((a,b) => a.net - b.net);

  const prizes = finalClosed ? finalResults.slice(0,3).map((p,i)=>({
    ...p, prize: Math.round(pot * PRIZE_SPLIT[i+1])
  })) : [];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e 0%,#0d2137 50%,#0a1a0f 100%)",fontFamily:"Georgia,serif",color:"#e8dcc8"}}>
      <div style={{background:"linear-gradient(180deg,#1a3a1a 0%,#0d2137 100%)",borderBottom:"3px solid #c8a84b",padding:"32px 20px 20px",textAlign:"center"}}>
        <div style={{fontSize:"13px",letterSpacing:"4px",color:"#c8a84b",marginBottom:"8px"}}>⛳ 2026 ⛳</div>
        <h1 style={{margin:0,fontSize:"clamp(28px,7vw,52px)",fontWeight:"900",color:"#fff",lineHeight:1.1}}>
          ACARREOS<br/><span style={{color:"#c8a84b"}}>HOLI CUP</span>
        </h1>
        <div style={{marginTop:"16px",display:"flex",justifyContent:"center",gap:"24px",flexWrap:"wrap"}}>
          {[
            {label:"Fechas Jugadas", value:datesPlayed},
            {label:"Pozo Acumulado", value:`$${pot}`},
            {label:"Clasificados",   value:`${qualifiedCount} / ${players.length}`},
          ].map(s=>(
            <div key={s.label} style={{background:"rgba(200,168,75,0.1)",border:"1px solid rgba(200,168,75,0.3)",borderRadius:"8px",padding:"8px 16px",textAlign:"center"}}>
              <div style={{fontSize:"20px",fontWeight:"bold",color:"#c8a84b"}}>{s.value}</div>
              <div style={{fontSize:"11px",color:"#9aa",letterSpacing:"1px"}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:"12px",display:"inline-flex",alignItems:"center",gap:6,padding:"6px 16px",borderRadius:20,background:"rgba(75,200,120,0.1)",border:"1px solid rgba(75,200,120,0.3)"}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:"#4bc87a",display:"inline-block"}}></span>
          <span style={{fontSize:12,color:"#4bc87a",letterSpacing:2}}>EN VIVO 🔥</span>
        </div>
      </div>

      <div style={{display:"flex",borderBottom:"1px solid rgba(200,168,75,0.2)",background:"rgba(0,0,0,0.3)",overflowX:"auto"}}>
        {[
          {key:"ranking",  label:"🏆 Ranking"},
          {key:"historial",label:"📅 Historial"},
          {key:"playoffs", label:"⚔️ Playoffs"},
          {key:"final",    label:"🏁 Final"},
          {key:"reglas",   label:"📋 Reglas"},
        ].map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{flex:1,minWidth:"70px",padding:"14px 6px",background:"none",border:"none",color:activeTab===t.key?"#c8a84b":"#888",borderBottom:activeTab===t.key?"3px solid #c8a84b":"3px solid transparent",cursor:"pointer",fontFamily:"inherit",fontSize:"11px",letterSpacing:"1px",textTransform:"uppercase",fontWeight:activeTab===t.key?"bold":"normal",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:"16px",maxWidth:"700px",margin:"0 auto"}}>

        {activeTab==="ranking" && (
          <div>
            <div style={{marginBottom:12,fontSize:11,color:"#667",letterSpacing:1}}>
              Top 8 puntajes por jugador · Playoffs ×2 · Mín. 6 fechas para clasificar
            </div>
            {withPos.map(player=>{
              const isTop3=player.pos<=3;
              const isExpanded=expandedPlayer===player.id;
              const datesEntered=player.results.filter(r=>r>0).length;
              const isQualified=datesEntered>=6;
              return (
                <div key={player.id} onClick={()=>setExpandedPlayer(isExpanded?null:player.id)}
                  style={{marginBottom:"8px",borderRadius:"12px",border:`1px solid ${isTop3?trophyColors[player.pos-1]+"60":"rgba(200,168,75,0.15)"}`,background:isTop3?`linear-gradient(135deg,rgba(${player.pos===1?"255,215,0":player.pos===2?"192,192,192":"205,127,50"},0.12) 0%,rgba(0,0,0,0.4) 100%)`:"rgba(255,255,255,0.04)",cursor:"pointer",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",padding:"14px 16px",gap:"14px"}}>
                    <div style={{width:"36px",textAlign:"center",fontSize:isTop3?"24px":"18px",fontWeight:"900",color:isTop3?trophyColors[player.pos-1]:"#667",flexShrink:0}}>
                      {isTop3?trophyEmoji[player.pos-1]:`#${player.pos}`}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:"700",fontSize:"16px",color:isTop3?trophyColors[player.pos-1]:"#e8dcc8"}}>{player.name}</div>
                      <div style={{fontSize:"11px",color:"#777",marginTop:"2px"}}>
                        {datesEntered} fecha{datesEntered!==1?"s":""} jugada{datesEntered!==1?"s":""}
                        {!isQualified&&datesEntered>0&&<span style={{color:"#c87a4b"}}> · Necesita {6-datesEntered} más</span>}
                        {isQualified&&<span style={{color:"#4bc87a"}}> · ✓ Clasificado</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:"24px",fontWeight:"900",color:isTop3?trophyColors[player.pos-1]:"#c8a84b"}}>{player.total}</div>
                      <div style={{fontSize:"10px",color:"#777",letterSpacing:"1px"}}>PTS</div>
                    </div>
                    <div style={{color:"#555",fontSize:"12px"}}>{isExpanded?"▲":"▼"}</div>
                  </div>
                  {isExpanded&&(
                    <div style={{borderTop:"1px solid rgba(200,168,75,0.15)",padding:"12px 16px",background:"rgba(0,0,0,0.2)"}}>
                      <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                        {player.results.map((pts,di)=>(
                          <div key={di} style={{background:pts>0?"rgba(200,168,75,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${pts>0?"rgba(200,168,75,0.3)":"rgba(255,255,255,0.1)"}`,borderRadius:"8px",padding:"8px 14px",textAlign:"center"}}>
                            <div style={{fontSize:"10px",color:"#888",letterSpacing:"1px"}}>FECHA {di+1}{player.isPlayoff?.[di]?" ⚔️":""}</div>
                            <div style={{fontSize:"20px",fontWeight:"bold",color:player.isPlayoff?.[di]?"#a87fe8":pts>0?"#c8a84b":"#555"}}>{pts>0?pts:"—"}</div>
                            {player.isPlayoff?.[di]&&pts>0&&<div style={{fontSize:"9px",color:"#a87fe8"}}>×2={pts*2}</div>}
                            {player.dailyWins[di]>0&&<div style={{fontSize:"10px",color:"#4bc87a"}}>+${player.dailyWins[di]}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={()=>setShowAddDate(true)} style={{width:"100%",marginTop:"16px",padding:"14px",background:"linear-gradient(135deg,#1a3a1a,#0d2137)",border:"2px dashed rgba(200,168,75,0.4)",borderRadius:"12px",color:"#c8a84b",fontSize:"14px",letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit"}}>
              + Agregar Fecha
            </button>
          </div>
        )}

        {activeTab==="historial"&&(
          <div>
            {Array.from({length:datesPlayed},(_,di)=>{
              const dr=[...players].filter(p=>p.results[di]>0).sort((a,b)=>b.results[di]-a.results[di]);
              const isPlayoffDate=players.some(p=>p.isPlayoff?.[di]);
              return (
                <div key={di} style={{marginBottom:"20px",borderRadius:"12px",border:`1px solid ${isPlayoffDate?"rgba(168,127,232,0.3)":"rgba(200,168,75,0.2)"}`,overflow:"hidden",background:"rgba(255,255,255,0.03)"}}>
                  <div style={{padding:"12px 16px",background:isPlayoffDate?"rgba(168,127,232,0.1)":"rgba(200,168,75,0.1)",borderBottom:`1px solid ${isPlayoffDate?"rgba(168,127,232,0.2)":"rgba(200,168,75,0.2)"}`,fontSize:"14px",fontWeight:"bold",letterSpacing:"2px",color:isPlayoffDate?"#a87fe8":"#c8a84b"}}>
                    📅 FECHA {di+1}{isPlayoffDate?" ⚔️ PLAYOFF":""}
                  </div>
                  {dr.map((p,rank)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <span style={{width:"24px",color:rank<3?trophyColors[rank]:"#667",fontWeight:"bold"}}>{rank<3?trophyEmoji[rank]:`${rank+1}.`}</span>
                      <span style={{flex:1}}>{p.name}</span>
                      <span style={{color:isPlayoffDate?"#a87fe8":"#c8a84b",fontWeight:"bold"}}>{p.results[di]} pts{isPlayoffDate?` (×2=${p.results[di]*2})`:""}</span>
                      {p.dailyWins[di]>0&&<span style={{fontSize:"11px",color:"#4bc87a"}}>🏆</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {activeTab==="playoffs"&&(
          <div>
            <div style={{marginBottom:16,padding:"14px 16px",borderRadius:10,background:"rgba(168,127,232,0.08)",border:"1px solid rgba(168,127,232,0.25)"}}>
              <div style={{fontSize:13,color:"#a87fe8",letterSpacing:2,fontWeight:"bold",marginBottom:6}}>⚔️ PLAYOFFS</div>
              <div style={{fontSize:12,color:"#778",lineHeight:1.8}}>
                Clasifican todos con <strong style={{color:"#e8dcc8"}}>mínimo 6 fechas jugadas</strong>.<br/>
                Se computan los <strong style={{color:"#e8dcc8"}}>top 8 puntajes</strong> de cada jugador.<br/>
                Fechas de playoff valen <strong style={{color:"#a87fe8"}}>×2 puntos</strong>.
              </div>
            </div>
            <div style={{fontSize:11,color:"#c8a84b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Jugadores clasificados ({qualifiedCount})</div>
            {qualifiedCount===0&&<div style={{padding:16,color:"#556",fontSize:13,textAlign:"center"}}>Nadie clasifica aún — mínimo 6 fechas.</div>}
            {qualified.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",padding:"12px 16px",marginBottom:6,borderRadius:10,background:"rgba(168,127,232,0.06)",border:"1px solid rgba(168,127,232,0.2)"}}>
                <span style={{width:32,fontSize:i<3?20:14,color:i<3?trophyColors[i]:"#778"}}>{i<3?trophyEmoji[i]:`#${i+1}`}</span>
                <span style={{flex:1,fontSize:14}}>{p.name}</span>
                <span style={{color:"#a87fe8",fontWeight:"bold"}}>{p.total} pts</span>
              </div>
            ))}
            <button onClick={()=>{setNewDateIsPlayoff(true);setShowAddDate(true);setActiveTab("ranking");}}
              style={{width:"100%",marginTop:20,padding:"14px",background:"rgba(168,127,232,0.15)",border:"2px dashed rgba(168,127,232,0.4)",borderRadius:"12px",color:"#a87fe8",fontSize:"14px",letterSpacing:"2px",textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit"}}>
              + Agregar Fecha Playoff
            </button>
          </div>
        )}

        {activeTab==="final"&&(
          <div>
            <div style={{marginBottom:16,padding:"14px 16px",borderRadius:10,background:"rgba(200,75,75,0.08)",border:"1px solid rgba(200,75,75,0.25)"}}>
              <div style={{fontSize:13,color:"#e87f7f",letterSpacing:2,fontWeight:"bold",marginBottom:6}}>🏁 RONDA FINAL — STROKE PLAY</div>
              <div style={{fontSize:12,color:"#778",lineHeight:1.8}}>
                Ingresa el score bruto de cada clasificado.<br/>
                Se restan golpes de ventaja según ranking.<br/>
                <strong style={{color:"#e8dcc8"}}>Menor score neto gana.</strong><br/>
                Reparto: <strong style={{color:"#c8a84b"}}>1° 60% · 2° 30% · 3° 10%</strong>
              </div>
            </div>
            <div style={{fontSize:11,color:"#c8a84b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Handicaps de ventaja</div>
            <div style={{marginBottom:16,borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden"}}>
              {qualified.length===0&&<div style={{padding:14,color:"#556",fontSize:13}}>No hay clasificados aún.</div>}
              {qualified.map((p,i)=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.03)"}}>
                  <span style={{width:28,color:"#667",fontSize:12}}>{i+1}°</span>
                  <span style={{flex:1,fontSize:13}}>{p.name}</span>
                  <span style={{color:"#e87f7f",fontSize:13}}>-{FINAL_HANDICAP[i+1]??0} golpes</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:"#c8a84b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Scores brutos</div>
            <div style={{borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden",marginBottom:16}}>
              {qualified.map((p,i)=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(255,255,255,0.03)"}}>
                  <span style={{width:28,color:"#667",fontSize:12}}>{i+1}°</span>
                  <span style={{flex:1,fontSize:13}}>{p.name}</span>
                  <input type="number" min="50" max="130" placeholder="score"
                    value={finalScores[p.id]??""}
                    onChange={e=>setFinalScores(prev=>({...prev,[p.id]:e.target.value}))}
                    style={{width:72,padding:"7px 8px",borderRadius:8,background:"rgba(0,0,0,0.5)",border:"1px solid rgba(200,168,75,0.3)",color:"#c8a84b",fontSize:16,textAlign:"center",fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            {finalResults.length>0&&(
              <>
                <div style={{fontSize:11,color:"#c8a84b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Resultados netos</div>
                <div style={{borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden",marginBottom:16}}>
                  {finalResults.map((p,i)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:i===0?"rgba(255,215,0,0.06)":i===1?"rgba(192,192,192,0.04)":i===2?"rgba(205,127,50,0.04)":"rgba(255,255,255,0.02)"}}>
                      <span style={{width:32,fontSize:i<3?20:14,color:i<3?trophyColors[i]:"#667"}}>{i<3?trophyEmoji[i]:`${i+1}.`}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,color:i<3?trophyColors[i]:"#e8dcc8"}}>{p.name}</div>
                        <div style={{fontSize:11,color:"#667"}}>{p.gross} − {p.hcp} = <strong style={{color:"#e8dcc8"}}>{p.net}</strong></div>
                      </div>
                      <span style={{fontSize:22,fontWeight:"bold",color:i<3?trophyColors[i]:"#c8a84b"}}>{p.net}</span>
                    </div>
                  ))}
                </div>
                {!finalClosed?(
                  <button onClick={()=>setFinalClosed(true)}
                    style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#c84b4b,#8b2020)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",letterSpacing:2,cursor:"pointer",fontFamily:"inherit"}}>
                    🏁 CERRAR TORNEO Y REPARTIR POZO
                  </button>
                ):(
                  <div style={{borderRadius:12,border:"2px solid rgba(200,168,75,0.4)",padding:"20px 16px",background:"rgba(200,168,75,0.06)",textAlign:"center"}}>
                    <div style={{fontSize:16,color:"#c8a84b",letterSpacing:3,marginBottom:16,fontWeight:"bold"}}>🏆 CAMPEONES HOLI CUP 2026 🏆</div>
                    {prizes.map((p,i)=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",padding:"12px 0",borderBottom:i<prizes.length-1?"1px solid rgba(200,168,75,0.15)":"none"}}>
                        <span style={{fontSize:24,marginRight:12}}>{trophyEmoji[i]}</span>
                        <span style={{flex:1,fontSize:16,color:trophyColors[i],fontWeight:"bold"}}>{p.name}</span>
                        <span style={{fontSize:20,color:"#c8a84b",fontWeight:"bold"}}>${p.prize}</span>
                      </div>
                    ))}
                    <div style={{marginTop:14,fontSize:11,color:"#556"}}>Pozo total: ${pot} · 60% / 30% / 10%</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab==="reglas"&&(
          <div style={{lineHeight:1.8}}>
            {[
              {title:"💰 Cuota",    content:"$10 por jugador por fecha al pozo acumulado. Pot diario opcional de $10."},
              {title:"🏆 Puntos",   content:"Top 8 resultados de cada jugador cuentan para el ranking final."},
              {title:"⚔️ Playoffs", content:"Fechas de playoff valen puntos doble (×2). Clasifican todos con mínimo 6 fechas."},
              {title:"📅 Mínimo",   content:"Mínimo 6 fechas para clasificar al final de temporada."},
              {title:"🤝 Empates",  content:"Se suman los puntos de las posiciones empatadas y se dividen equitativamente."},
              {title:"🚫 No-shows", content:"El que no juega, no paga ni gana puntos."},
              {title:"🏁 Final",    content:"Stroke play con handicap de ventaja: 1° recibe 6 golpes, 2° cinco, 3° cuatro, 4° tres, 5° dos, 6° uno. Menor score neto gana."},
              {title:"💵 Reparto",  content:"El pozo acumulado se reparte: 1° recibe 60%, 2° recibe 30%, 3° recibe 10%."},
            ].map(r=>(
              <div key={r.title} style={{marginBottom:"12px",padding:"16px",borderRadius:"10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,168,75,0.15)"}}>
                <div style={{fontWeight:"bold",color:"#c8a84b",marginBottom:"6px"}}>{r.title}</div>
                <div style={{color:"#bbb",fontSize:"14px"}}>{r.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddDate&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}}>
          <div style={{background:"#0d2137",border:"1px solid rgba(200,168,75,0.3)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"700px",maxHeight:"90vh",overflowY:"auto",padding:"24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <h2 style={{margin:0,color:newDateIsPlayoff?"#a87fe8":"#c8a84b",fontSize:"18px"}}>
                {newDateIsPlayoff?"⚔️":"📅"} Fecha {datesPlayed+1}{newDateIsPlayoff?" — PLAYOFF":""}
              </h2>
              <button onClick={()=>{setShowAddDate(false);setNewDateIsPlayoff(false);}} style={{background:"none",border:"none",color:"#888",fontSize:"24px",cursor:"pointer"}}>✕</button>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 14px",borderRadius:8,background:"rgba(168,127,232,0.08)",border:"1px solid rgba(168,127,232,0.2)",cursor:"pointer"}}>
              <input type="checkbox" checked={newDateIsPlayoff} onChange={e=>setNewDateIsPlayoff(e.target.checked)} style={{width:16,height:16}}/>
              <span style={{fontSize:13,color:"#a87fe8"}}>⚔️ Esta es una fecha de <strong>Playoff</strong> (puntos ×2)</span>
            </label>
            {players.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px",padding:"10px 12px",background:"rgba(255,255,255,0.04)",borderRadius:"8px"}}>
                <span style={{flex:1,fontSize:"14px"}}>{p.name}</span>
                <label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"12px",color:"#888"}}>
                  <input type="checkbox" checked={!!newDatePaid[p.id]} onChange={e=>setNewDatePaid(prev=>({...prev,[p.id]:e.target.checked}))}/> Pagó
                </label>
                <label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"12px",color:"#4bc87a"}}>
                  <input type="radio" name="winner" checked={newDateWinner===p.id} onChange={()=>setNewDateWinner(p.id)}/> 🏆
                </label>
                <input type="number" min="0" value={newDateResults[p.id]??""} onChange={e=>setNewDateResults(prev=>({...prev,[p.id]:e.target.value}))} placeholder="pts"
                  style={{width:"64px",padding:"6px 8px",borderRadius:"6px",background:"rgba(0,0,0,0.4)",border:`1px solid ${newDateIsPlayoff?"rgba(168,127,232,0.4)":"rgba(200,168,75,0.3)"}`,color:newDateIsPlayoff?"#a87fe8":"#c8a84b",fontSize:"16px",textAlign:"center"}}/>
              </div>
            ))}
            <button onClick={handleAddDate} style={{width:"100%",marginTop:"16px",padding:"16px",background:newDateIsPlayoff?"linear-gradient(135deg,#7b4fa8,#5a2d8a)":"linear-gradient(135deg,#c8a84b,#a8882b)",border:"none",borderRadius:"10px",color:"#fff",fontSize:"16px",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",letterSpacing:"2px"}}>
              GUARDAR FECHA
            </button>
          </div>
        </div>
      )}

      <div style={{textAlign:"center",padding:"20px",color:"#444",fontSize:"11px",letterSpacing:"1px"}}>ACARREOS HOLI CUP © 2026</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AcarreosHoliCup />);
