import { useState } from "react";

const POINTS_TABLE = {
  1: 200, 2: 175, 3: 150, 4: 130, 5: 110,
  6: 90, 7: 75, 8: 60, 9: 50, 10: 40,
  11: 30, 12: 20, 13: 10, 14: 5
};

const initialPlayers = [
  { id: 1,  name: "El Doctor",        results: [75, 60], paid: [10,10], dailyWins: [0,10] },
  { id: 2,  name: "Felipao",          results: [60, 70], paid: [10,10], dailyWins: [0,0]  },
  { id: 3,  name: "Gio",              results: [50, 50], paid: [10,10], dailyWins: [10,0] },
  { id: 4,  name: "Diegolfa",         results: [50, 50], paid: [10,10], dailyWins: [0,0]  },
  { id: 5,  name: "Felipe R",         results: [75, 0],  paid: [10,10], dailyWins: [0,0]  },
  { id: 6,  name: "Ñaño",            results: [0,  50], paid: [0, 10], dailyWins: [0,0]  },
  { id: 7,  name: "Daniel B",         results: [50, 0],  paid: [10,0],  dailyWins: [0,0]  },
  { id: 8,  name: "Garbimba Asesina", results: [30, 0],  paid: [10,0],  dailyWins: [0,0]  },
  { id: 9,  name: "Pistolas",         results: [0,  30], paid: [0, 10], dailyWins: [0,0]  },
  { id: 10, name: "Juanca",           results: [30, 0],  paid: [10,0],  dailyWins: [0,0]  },
  { id: 11, name: "Paisa",            results: [10, 0],  paid: [10,0],  dailyWins: [0,0]  },
  { id: 12, name: "Nayibe",           results: [0,  0],  paid: [0, 0],  dailyWins: [0,0]  },
  { id: 13, name: "Fercho",           results: [0,  0],  paid: [0, 0],  dailyWins: [0,0]  },
  { id: 14, name: "El Nene",          results: [0,  0],  paid: [0, 0],  dailyWins: [0,0]  },
  { id: 15, name: "Yerri",            results: [0,  0],  paid: [0, 0],  dailyWins: [0,0]  },
  { id: 16, name: "Juan Rory",        results: [0,  0],  paid: [0, 0],  dailyWins: [0,0]  },
  { id: 17, name: "Chapo",            results: [0,  0],  paid: [0, 0],  dailyWins: [0,0]  },
  { id: 18, name: "Dani B",           results: [0,  0],  paid: [0, 0],  dailyWins: [0,0]  },
];

const trophyColors = ["#FFD700","#C0C0C0","#CD7F32"];
const trophyEmoji  = ["🥇","🥈","🥉"];

function calcTotalPoints(results) {
  return [...results].sort((a,b)=>b-a).slice(0,8).reduce((a,b)=>a+b,0);
}
function calcPot(players) {
  return players.reduce((s,p)=>s+p.paid.reduce((a,b)=>a+b,0),0);
}

export default function AcarreosHoliCup() {
  const [players, setPlayers]               = useState(initialPlayers);
  const [activeTab, setActiveTab]           = useState("ranking");
  const [showAddDate, setShowAddDate]       = useState(false);
  const [newDateResults, setNewDateResults] = useState({});
  const [newDatePaid, setNewDatePaid]       = useState({});
  const [newDateWinner, setNewDateWinner]   = useState(null);
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  const ranked = [...players]
    .map(p=>({...p, total: calcTotalPoints(p.results)}))
    .sort((a,b)=>b.total-a.total);

  let pos = 1;
  const withPos = ranked.map((p,i)=>{
    if(i>0 && ranked[i-1].total!==p.total) pos=i+1;
    return {...p, pos};
  });

  const pot         = calcPot(players);
  const datesPlayed = players[0]?.results.length ?? 0;
  const qualifiedCount = withPos.filter(p=>p.results.filter(r=>r>0).length>=6).length;

  function handleAddDate(){
    const updated = players.map(p=>({
      ...p,
      results:   [...p.results,   parseInt(newDateResults[p.id]??'0')||0],
      paid:      [...p.paid,      newDatePaid[p.id]?10:0],
      dailyWins: [...p.dailyWins, newDateWinner===p.id?10:0],
    }));
    setPlayers(updated);
    setNewDateResults({}); setNewDatePaid({}); setNewDateWinner(null); setShowAddDate(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e 0%,#0d2137 50%,#0a1a0f 100%)",fontFamily:"Georgia,serif",color:"#e8dcc8"}}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(180deg,#1a3a1a 0%,#0d2137 100%)",borderBottom:"3px solid #c8a84b",padding:"32px 20px 20px",textAlign:"center"}}>
        <div style={{fontSize:"13px",letterSpacing:"4px",color:"#c8a84b",marginBottom:"8px"}}>⛳ Copa Oficial ⛳</div>
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
      </div>

      {/* TABS */}
      <div style={{display:"flex",borderBottom:"1px solid rgba(200,168,75,0.2)",background:"rgba(0,0,0,0.3)"}}>
        {["ranking","historial","reglas"].map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{flex:1,padding:"14px",background:"none",border:"none",color:activeTab===tab?"#c8a84b":"#888",borderBottom:activeTab===tab?"3px solid #c8a84b":"3px solid transparent",cursor:"pointer",fontFamily:"inherit",fontSize:"13px",letterSpacing:"2px",textTransform:"uppercase",fontWeight:activeTab===tab?"bold":"normal"}}>
            {tab==="ranking"?"🏆 Ranking":tab==="historial"?"📅 Historial":"📋 Reglas"}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div style={{padding:"16px",maxWidth:"700px",margin:"0 auto"}}>

        {activeTab==="ranking" && (
          <div>
            {withPos.map(player=>{
              const isTop3      = player.pos<=3;
              const isExpanded  = expandedPlayer===player.id;
              const datesEntered= player.results.filter(r=>r>0).length;
              const isQualified = datesEntered>=6;
              return (
                <div key={player.id} onClick={()=>setExpandedPlayer(isExpanded?null:player.id)}
                  style={{marginBottom:"8px",borderRadius:"12px",
                    border:`1px solid ${isTop3?trophyColors[player.pos-1]+"60":"rgba(200,168,75,0.15)"}`,
                    background:isTop3?`linear-gradient(135deg,rgba(${player.pos===1?"255,215,0":player.pos===2?"192,192,192":"205,127,50"},0.12) 0%,rgba(0,0,0,0.4) 100%)`:"rgba(255,255,255,0.04)",
                    cursor:"pointer",overflow:"hidden"}}>
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
                            <div style={{fontSize:"10px",color:"#888",letterSpacing:"1px"}}>FECHA {di+1}</div>
                            <div style={{fontSize:"20px",fontWeight:"bold",color:pts>0?"#c8a84b":"#555"}}>{pts>0?pts:"—"}</div>
                            {player.dailyWins[di]>0&&<div style={{fontSize:"10px",color:"#4bc87a"}}>+${player.dailyWins[di]} pot</div>}
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
              return (
                <div key={di} style={{marginBottom:"20px",borderRadius:"12px",border:"1px solid rgba(200,168,75,0.2)",overflow:"hidden",background:"rgba(255,255,255,0.03)"}}>
                  <div style={{padding:"12px 16px",background:"rgba(200,168,75,0.1)",borderBottom:"1px solid rgba(200,168,75,0.2)",fontSize:"14px",fontWeight:"bold",letterSpacing:"2px",color:"#c8a84b"}}>📅 FECHA {di+1}</div>
                  {dr.map((p,rank)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <span style={{width:"24px",color:rank<3?trophyColors[rank]:"#667",fontWeight:"bold"}}>{rank<3?trophyEmoji[rank]:`${rank+1}.`}</span>
                      <span style={{flex:1}}>{p.name}</span>
                      <span style={{color:"#c8a84b",fontWeight:"bold"}}>{p.results[di]} pts</span>
                      {p.dailyWins[di]>0&&<span style={{fontSize:"11px",color:"#4bc87a"}}>🏆 Daily</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {activeTab==="reglas"&&(
          <div style={{lineHeight:1.8}}>
            {[
              {title:"💰 Cuota",    content:"$10 por jugador por fecha al pozo acumulado. Pot diario opcional de $10."},
              {title:"🏆 Puntos",   content:"Top 8 resultados de cada jugador cuentan para el ranking final."},
              {title:"📅 Mínimo",   content:"Mínimo 6 fechas para clasificar al final de temporada."},
              {title:"🤝 Empates",  content:"Se suman los puntos de las posiciones empatadas y se dividen equitativamente."},
              {title:"🚫 No-shows", content:"El que no juega, no paga ni gana puntos."},
              {title:"💵 Pozo",     content:"El pozo acumulado se reparte entre los mejores clasificados al final."},
            ].map(r=>(
              <div key={r.title} style={{marginBottom:"12px",padding:"16px",borderRadius:"10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(200,168,75,0.15)"}}>
                <div style={{fontWeight:"bold",color:"#c8a84b",marginBottom:"6px"}}>{r.title}</div>
                <div style={{color:"#bbb",fontSize:"14px"}}>{r.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD DATE MODAL */}
      {showAddDate&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}}>
          <div style={{background:"#0d2137",border:"1px solid rgba(200,168,75,0.3)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:"700px",maxHeight:"90vh",overflowY:"auto",padding:"24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <h2 style={{margin:0,color:"#c8a84b",fontSize:"18px"}}>📅 Fecha {datesPlayed+1}</h2>
              <button onClick={()=>setShowAddDate(false)} style={{background:"none",border:"none",color:"#888",fontSize:"24px",cursor:"pointer"}}>✕</button>
            </div>
            {players.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px",padding:"10px 12px",background:"rgba(255,255,255,0.04)",borderRadius:"8px"}}>
                <span style={{flex:1,fontSize:"14px"}}>{p.name}</span>
                <label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"12px",color:"#888"}}>
                  <input type="checkbox" checked={!!newDatePaid[p.id]} onChange={e=>setNewDatePaid(prev=>({...prev,[p.id]:e.target.checked}))}/> Pagó
                </label>
                <label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"12px",color:"#4bc87a"}}>
                  <input type="radio" name="winner" checked={newDateWinner===p.id} onChange={()=>setNewDateWinner(p.id)}/> 🏆
                </label>
                <input type="number" min="0" value={newDateResults[p.id]??""} onChange={e=>setNewDateResults(prev=>({...prev,[p.id]:e.target.value}))} placeholder="0"
                  style={{width:"64px",padding:"6px 8px",borderRadius:"6px",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(200,168,75,0.3)",color:"#c8a84b",fontSize:"16px",textAlign:"center"}}/>
              </div>
            ))}
            <button onClick={handleAddDate} style={{width:"100%",marginTop:"16px",padding:"16px",background:"linear-gradient(135deg,#c8a84b,#a8882b)",border:"none",borderRadius:"10px",color:"#0a0f1e",fontSize:"16px",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",letterSpacing:"2px"}}>
              GUARDAR FECHA
            </button>
          </div>
        </div>
      )}

      <div style={{textAlign:"center",padding:"20px",color:"#444",fontSize:"11px",letterSpacing:"1px"}}>ACARREOS HOLI CUP © 2026</div>
    </div>
  );
}
