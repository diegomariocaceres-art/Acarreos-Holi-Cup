const { createClient } = supabase;
const { useState, useEffect } = React;

const SUPABASE_URL = "https://xxbrrtyuqrbypaqioqfq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YnJydHh1cXJieXBhcWlvcWZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTY1MzMsImV4cCI6MjA5NTI3MjUzM30.dfVWR8PW52_CyqJUd1bnZCoWhefZNgSOlWo5783akHE";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const POINTS_TABLE = {
  1:200,2:175,3:150,4:130,5:110,6:90,7:75,8:60,9:50,10:40,11:30,12:20,13:10,14:5
};
const FINAL_HANDICAP = {1:6,2:5,3:4,4:3,5:2,6:1};
const PRIZE_SPLIT = {1:0.60,2:0.30,3:0.10};
const ALL_PLAYERS = [
  "El Doctor","Felipao","Gio","Diegolfa","Felipe R","Ñaño","Daniel B",
  "Garbimba Asesina","Pistolas","Juanca","Paisa","Nayibe","Fercho",
  "El Nene","Yerri","Juan Rory","Chapo","Dani B"
];
const trophyColors = ["#FFD700","#C0C0C0","#CD7F32"];
const trophyEmoji  = ["🥇","🥈","🥉"];

function calcTotalPoints(scores) {
  return [...scores].sort((a,b)=>b-a).slice(0,8).reduce((a,b)=>a+b,0);
}

function buildPlayers(fechas) {
  return ALL_PLAYERS.map(name => {
    const scores = fechas.map(f => {
      const pts = f.resultados[name] ?? 0;
      return f.es_playoff ? pts * 2 : pts;
    });
    const paid = fechas.map(f => f.pagos[name] ?? 0);
    const wins = fechas.map(f => f.daily_wins[name] ?? 0);
    const datesPlayed = fechas.filter(f => (f.resultados[name] ?? 0) > 0).length;
    const total = calcTotalPoints(scores);
    return { name, scores, paid, wins, datesPlayed, total };
  });
}

function App() {
  const [fechas, setFechas]             = useState([]);
  const [activeTab, setActiveTab]       = useState("ranking");
  const [showAddDate, setShowAddDate]   = useState(false);
  const [newResults, setNewResults]     = useState({});
  const [newPaid, setNewPaid]           = useState({});
  const [newWinner, setNewWinner]       = useState(null);
  const [newIsPlayoff, setNewIsPlayoff] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [finalScores, setFinalScores]   = useState({});
  const [finalClosed, setFinalClosed]   = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    loadFechas();
    const channel = db
      .channel('fechas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fechas' }, () => loadFechas())
      .subscribe();
    return () => db.removeChannel(channel);
  }, []);

  async function loadFechas() {
    try {
      const { data, error } = await db.from('fechas').select('*').order('id');
      if (error) { setError(error.message); setLoading(false); return; }
      setFechas(data || []);
      setLoading(false);
    } catch(e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function handleAddDate() {
    const resultados = {}, pagos = {}, daily_wins = {};
    ALL_PLAYERS.forEach(p => {
      const pts = parseInt(newResults[p] ?? '0') || 0;
      if (pts > 0) resultados[p] = pts;
      if (newPaid[p]) pagos[p] = 10;
      if (newWinner === p) daily_wins[p] = 10;
    });
    await db.from('fechas').insert({
      nombre: `Fecha ${fechas.length + 1}`,
      es_playoff: newIsPlayoff,
      resultados, pagos, daily_wins
    });
    setNewResults({}); setNewPaid({}); setNewWinner(null);
    setNewIsPlayoff(false); setShowAddDate(false);
  }

  const players = buildPlayers(fechas);
  const ranked = [...players].sort((a,b) => b.total - a.total);
  let pos = 1;
  const withPos = ranked.map((p,i) => {
    if (i > 0 && ranked[i-1].total !== p.total) pos = i + 1;
    return { ...p, pos };
  });
  const pot = players.reduce((s,p) => s + p.paid.reduce((a,b)=>a+b,0), 0);
  const qualified = withPos.filter(p => p.datesPlayed >= 6);
  const finalResults = qualified
    .filter(p => finalScores[p.name] != null && finalScores[p.name] !== "")
    .map((p,i) => {
      const gross = Number(finalScores[p.name]);
      const hcp = FINAL_HANDICAP[i+1] ?? 0;
      return { ...p, gross, hcp, net: gross - hcp };
    }).sort((a,b) => a.net - b.net);
  const prizes = finalClosed ? finalResults.slice(0,3).map((p,i) => ({
    ...p, prize: Math.round(pot * PRIZE_SPLIT[i+1])
  })) : [];

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#c8a84b",fontFamily:"Georgia,serif",gap:16}}>
      <div style={{fontSize:32}}>⛳</div>
      <div style={{fontSize:18}}>Cargando...</div>
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#e87f7f",fontFamily:"Georgia,serif",gap:16,padding:20}}>
      <div style={{fontSize:32}}>⚠️</div>
      <div style={{fontSize:14,textAlign:"center"}}>Error: {error}</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e 0%,#0d2137 50%,#0a1a0f 100%)",fontFamily:"Georgia,serif",color:"#e8dcc8"}}>
      <div style={{background:"linear-gradient(180deg,#1a3a1a 0%,#0d2137 100%)",borderBottom:"3px solid #c8a84b",padding:"32px 20px 20px",textAlign:"center"}}>
        <div style={{fontSize:"13px",letterSpacing:"4px",color:"#c8a84b",marginBottom:"8px"}}>⛳ 2026 ⛳</div>
        <h1 style={{margin:0,fontSize:"clamp(28px,7vw,52px)",fontWeight:"900",color:"#fff",lineHeight:1.1}}>
          ACARREOS<br/><span style={{color:"#c8a84b"}}>HOLI CUP</span>
        </h1>
        <div style={{marginTop:"16px",display:"flex",justifyContent:"center",gap:"24px",flexWrap:"wrap"}}>
          {[
            {label:"Fechas Jugadas",value:fechas.length},
            {label:"Pozo Acumulado",value:`$${pot}`},
            {label:"Clasificados",value:`${qualified.length} / ${ALL_PLAYERS.length}`},
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
          {key:"ranking",label:"🏆 Ranking"},
