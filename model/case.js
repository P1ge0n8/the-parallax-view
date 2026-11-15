import * as THREE from "three";
import {ENGLISH_BRAND} from "../src/brand.js";

// Apple M1580. Measurements in metres with the bottom on the recorder's lid.
// Profiles follow the front, rear and side photographs of the 1993 enclosure.
const baseY = .858;
export const glass = {y: baseY + .303, width: .264, height: .200, z: .16};

function plastic(name, color, roughness = .61) {
  return new THREE.MeshStandardMaterial({name, color, roughness, metalness: 0});
}

// Matching rings make the seams, crown and changing depth of the moulding continuous.
function outline(width, height, radius, centerY, depth, bow = 0, crown = 0) {
  const ring = [];
  const w = width / 2, h = height / 2, r = Math.min(radius, w, h);
  const corners = [[w-r,h-r],[-w+r,h-r],[-w+r,-h+r],[w-r,-h+r]];
  for (let k = 0; k < 4; k++) {
    const [cx,cy] = corners[k];
    const angle = k * Math.PI/2;
    const points = [];
    for (let i=0; i<=5; i++) {
      const a = angle + Math.PI/2*i/5;
      points.push([cx + r*Math.cos(a), cy + r*Math.sin(a)]);
    }
    const [nx,ny] = corners[(k+1)%4];
    const endX=nx+r*Math.cos(angle+Math.PI/2), endY=ny+r*Math.sin(angle+Math.PI/2);
    const [x0,y0] = points[points.length-1];
    for (let i=1; i<16; i++) points.push([x0+(endX-x0)*i/16,y0+(endY-y0)*i/16]);
    for (const [x,y] of points) {
      const x2=(x/w)**2;
      ring.push([x,centerY + y + crown*(1-x2)*y/h,depth-bow*x2]);
    }
  }
  return ring;
}

function surface(rings) {
  const n=rings[0].length, indices=[];
  for(let r=0; r<rings.length-1; r++) for(let i=0; i<n; i++) {
    const a=r*n+i, b=r*n+(i+1)%n;
    indices.push(a,b,b+n, a,b+n,a+n);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(rings.flat(2),3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Fill the end faces in vertical strips. The chin is cylindrical across its width:
// a fan to its centre would make a false diagonal crease in the specular light.
function closedShell(profiles) {
  const rings=profiles.map(p=>outline(...p));
  const skin=surface(rings);
  const positions=Array.from(skin.getAttribute("position").array);
  const normals=Array.from(skin.getAttribute("normal").array);
  const indices=Array.from(skin.index.array);
  function endFace(ring, profile, direction) {
    const [width,,,,,bow=0]=profile;
    const columns=new Map();
    for(const [x,y,z] of ring){
      const key=x.toFixed(7), column=columns.get(key);
      if(column){column.low=Math.min(column.low,y);column.high=Math.max(column.high,y);}
      else columns.set(key,{x,low:y,high:y,z});
    }
    const sorted=[...columns.values()].sort((a,b)=>a.x-b.x);
    const start=positions.length/3;
    for(const {x,low,high,z} of sorted){
      const slope=8*bow*x/(width*width), scale=direction/Math.hypot(slope,1);
      positions.push(x,low,z,x,high,z);
      normals.push(slope*scale,0,scale,slope*scale,0,scale);
    }
    for(let i=0;i<sorted.length-1;i++){
      const a=start+2*i;
      if(direction>0) indices.push(a,a+2,a+3,a,a+3,a+1);
      else indices.push(a,a+3,a+2,a,a+1,a+3);
    }
  }
  endFace(rings[0],profiles[0],-1);
  endFace(rings[rings.length-1],profiles[profiles.length-1],1);
  skin.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  skin.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));
  skin.setIndex(indices);
  return skin;
}

function paintedMap(width,height,paint) {
  const page=document.createElement("canvas"); page.width=width; page.height=height;
  paint(page.getContext("2d"),width,height);
  const texture=new THREE.CanvasTexture(page);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  return texture;
}

function dogBadgeMap() {
  return paintedMap(432,354,c=>{
    // The single-stroke Parallax hound, with space around the enamel line.
    c.translate(-295,-293);
    const hound=new Path2D(
      "M349 620 Q374 618 379 594 L401 487 C377 469 363 447 367 420 "+
      "C370 401 384 386 384 374 Q384 360 366 355 L320 342 316 333 349 331 "+
      "Q360 330 374 319 Q390 307 406 313 Q429 320 423 347 Q409 345 401 323 "+
      "L440 383 Q459 411 493 411 L586 411 C634 411 654 425 673 462 "+
      "Q690 497 706 467 Q710 507 684 496 Q664 481 651 450 "+
      "C649 473 627 494 626 515 Q625 529 642 550 L663 576 639 615 "+
      "Q632 628 615 629 Q625 622 628 612 L637 582 600 552 "+
      "C582 537 581 512 575 498 C567 481 549 480 526 486 "+
      "C483 499 451 508 422 491"
    );
    c.strokeStyle="#e6e3ce";
    c.lineWidth=14;
    c.lineCap="round";
    c.lineJoin="round";
    c.stroke(hound);
  });
}

export function installMacintoshTV(root) {
  const oldParts=/^(?:tv_|bnc_|power_inlet$|btn_|led_|knob_|wordmark$|rule_input$|t_(?:btn_|knob_|power$|input$|tapetron$|model$|pal$))/;
  const retired=[];
  root.traverse(o=>{if(oldParts.test(o.name)) retired.push(o);});
  for(const o of retired) o.removeFromParent();

  const picture=root.getObjectByName("screen");
  // Keep the curved Trinitron glass, UV hit testing and live CRT material.
  picture.scale.set(.938,.934,1);
  picture.position.y=glass.y-.198*picture.scale.y;

  const mac=new THREE.Group(); mac.name="Macintosh TV (1993)";
  mac.position.y=baseY; root.add(mac);
  const housing=plastic("Macintosh TV · textured charcoal ABS","#28292c");
  const inset=plastic("Macintosh TV · inner moulding","#202124",.52);
  const lower=plastic("Macintosh TV · pedestal","#252629");
  const edge=plastic("Macintosh TV · seam","#121315",.76);
  const shadow=plastic("Macintosh TV · recessed opening","#08090a",.87);
  const control=plastic("Macintosh TV · controls","#33353a",.47);
  const silver=plastic("Macintosh TV · nickel","#777a7c",.36);
  const beige=plastic("Macintosh TV · CD caddy door","#b3aea3",.7);
  function add(name,geometry,material,x=0,y=0,z=0) {
    const mesh=new THREE.Mesh(geometry,material); mesh.name="tv_mac_"+name; mesh.position.set(x,y,z); mac.add(mesh); return mesh;
  }
  function box(name,w,h,d,material,x,y,z) { return add(name,new THREE.BoxGeometry(w,h,d),material,x,y,z); }
  function disc(name,r,d,material,x,y,z) {
    const mesh=add(name,new THREE.CylinderGeometry(r,r,d,24),material,x,y,z);
    mesh.rotation.x=Math.PI/2; return mesh;
  }
  function plate(name,w,h,material,x,y,z,r=.0008,d=.001) {
    return add(name,closedShell([[w,h,r,0,-d/2],[w,h,r,0,d/2]]),material,x,y,z);
  }
  function print(name,w,h,texture,x,y,z,rotationY=0) {
    const ink = new THREE.MeshStandardMaterial({name:"Macintosh TV · "+name,map:texture,transparent:true,depthWrite:false,roughness:.7,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    const mesh=add(name,new THREE.PlaneGeometry(w,h),ink,x,y,z);
    mesh.rotation.y=rotationY; mesh.renderOrder=1; return mesh;
  }

  // Broad floating face, bowed across the tube. The last ring goes behind the glass.
  const frame=[
    [.337,.285,.005,.303,.105,0,.0015], [.344,.291,.005,.303,.109,0,.0020],
    [.344,.292,.004,.303,.176,.007,.0032], [.340,.288,.004,.303,.179,.007,.0032],
    [.283,.208,.002,.303,.179,.007,.0020], [.277,.205,.002,.303,.178,.007,.0012],
    [.263,.199,.002,.303,.159,.012,0], [.261,.198,.002,.303,.145,.010,0]
  ];
  add("back_of_mask",surface([
    [.300,.250,.012,.303,.105,0,.0015], frame[0]
  ].map(p=>outline(...p))),housing);
  add("front_mask",surface(frame.slice(0,6).map(p=>outline(...p))),housing);
  add("tube_reveal",surface(frame.slice(5).map(p=>outline(...p))),inset);

  // Funnel behind the face and the separate flat-sided, sloped rear housing.
  add("tube_cowl",closedShell([
    [.267,.160,.046,.251,-.045], [.282,.173,.040,.262,-.015],
    [.305,.209,.032,.282,.055], [.328,.272,.015,.301,.112]
  ]),housing);
  add("rear_shell",closedShell([
    [.255,.177,.014,.244,-.237], [.269,.194,.016,.247,-.23],
    [.284,.207,.015,.255,-.13], [.295,.219,.015,.263,.052], [.295,.218,.015,.263,.066]
  ]),housing);
  add("lower_chassis",closedShell([
    [.280,.084,.009,.111,-.244], [.297,.089,.007,.110,-.238],
    [.300,.090,.005,.110,.105], [.300,.090,.006,.110,.110]
  ]),lower);
  add("drive_chin",closedShell([
    [.296,.094,.005,.110,.084], [.301,.095,.004,.110,.089],
    [.302,.094,.004,.110,.166,.005,.004], [.298,.090,.004,.110,.169,.005,.004]
  ]),housing);
  add("speaker_pedestal",closedShell([
    [.246,.062,.010,.052,-.235], [.262,.064,.009,.052,-.228],
    [.263,.066,.009,.051,.036], [.266,.066,.008,.038,.083],
    [.266,.068,.008,.037,.130], [.257,.065,.009,.037,.147,.002]
  ]),lower);
  for(const x of [-.103,.103]){
    const foot=add("rubber_foot",new THREE.CylinderGeometry(.019,.017,.006,24),edge,x,.003,.111);
    foot.scale.z=1.18;
  }

  // Centre the whole lens assembly between the crown and the glass opening.
  const lensY=.430;
  disc("microphone_rim",.0050,.0014,silver,0,lensY,.1794);
  disc("microphone",.0039,.0018,inset,0,lensY,.1800);
  disc("microphone_port",.0017,.0020,shadow,0,lensY,.1802);
  plate("drive_recess",.259,.017,shadow,0,.130,.1703,.0017);
  // The drive doors sit in a continuous recess. The CD caddy is the original light grey.
  plate("cd_caddy",.133,.0107,beige,-.056,.130,.1714);
  box("cd_caddy_lip",.13,.0008,.0007,silver,-.056,.1254,.1721);
  const cdInk=paintedMap(512,48,(c)=>{
    c.strokeStyle="#77756d"; c.lineWidth=2;
    for(const x of [18,466]) c.strokeRect(x,12,23,19);
    c.strokeRect(231,12,42,21); c.font="14px sans-serif"; c.fillStyle="#77756d"; c.fillText("CD",241,28);
  });
  print("caddy_imprint",.129,.010,cdInk,-.056,.130,.1722);
  plate("superdrive_face",.104,.0134,inset,.077,.130,.1711);
  plate("floppy_slot",.097,.0054,shadow,.075,.1318,.1721);
  box("floppy_lip",.091,.0013,.0011,control,.075,.128,.1722);
  disc("eject_pinhole",.0008,.001,shadow,.137,.130,.1658);
  print("parallax_hound",.027,.02025,dogBadgeMap(),0,.103,.16975);
  const light=disc("activity",.0010,.0012,edge,.020,.109,.1695); light.name="led_power";
  light.material=plastic("led","#242628",.37);
  const badgeY=.0785;
  plate("model_badge",.065,.014,edge,0,badgeY,.1699,.0013);
  const label=paintedMap(664,136,(c)=>{
    c.textAlign="center";
    c.fillStyle="#d9d7c8";
    c.font='500 64px Geist, Arial, sans-serif';
    c.letterSpacing="0px";
    c.fillText(ENGLISH_BRAND,332,90,565);
  });
  print("model_name",.061,.0125,label,0,badgeY,.1708);

  const holes=paintedMap(768,288,(c)=>{
    for(let y=0;y<7;y++) for(let x=0;x<14;x++) {
      const px=28+x*54.6,py=25+y*39;
      c.fillStyle="rgba(160,161,164,.28)";c.beginPath();c.ellipse(px,py+3.3,10,10,0,0,Math.PI*2);c.fill();
      c.fillStyle="#090a0b"; c.beginPath();c.ellipse(px,py,9.2,9.3,0,0,Math.PI*2);c.fill();
    }
  });
  for(const x of [-.075,.075]) print("speaker_perforations",.087,.041,holes,x,.038,.1475);
  for(const [side,x] of [["brightness",-.018],["volume",.018]]){
    plate(side+"_well",.009,.025,shadow,x,.037,.1484,.004);
    for(const direction of [-1,1]) {
      const rocker=plate(side+(direction>0?"_up":"_down"),.0059,.009,control,x,.037+direction*.0057,.1494,.0025,.0025);
      rocker.userData.macAdjustment={side,direction};
    }
  }
  disc("headphone_rim",.0047,.0016,edge,0,.041,.1486);
  disc("headphone_socket",.0029,.0018,shadow,0,.041,.1491);
  const receiver=plate("ir_receiver",.0052,.0046,inset,0,.023,.1483);
  receiver.name="btn_power";

  // Side ventilation belongs to the two lower compartments, forward of the rear I/O.
  const ventMap=paintedMap(960,256,c=>{
    for(let i=0;i<28;i++) for(let y=0;y<6;y++) {
      const x=11+i*34, top=8+y*41;
      c.fillStyle="rgba(140,141,144,.24)";c.fillRect(x+2,top+2,11,33);
      c.fillStyle="#0b0c0e"; c.fillRect(x,top,10,31);
    }
  });
  for(const side of [-1,1]) {
    print("case_vents",.222,.069,ventMap,side*.1504,.111,-.102,side*Math.PI/2);
    print("base_vents",.200,.036,ventMap,side*.1317,.052,-.107,side*Math.PI/2);
  }
  const rearVent=paintedMap(480,384,c=>{
    for(let y=0;y<13;y++) for(let x=0;x<10;x++){
      c.fillStyle="rgba(150,152,154,.25)";c.fillRect(x*47+2,y*29+4,42,18);
      c.fillStyle="#090a0b";c.fillRect(x*47,y*29,42,17);
    }
  });
  print("rear_fan",.100,.103,rearVent,.072,.246,-.2377,Math.PI);
  const serial=paintedMap(128,256,c=>{
    c.fillStyle="#c0beb4";c.fillRect(0,0,128,256);c.fillStyle="#313236";
    for(let x=16;x<114;x+=4) c.fillRect(x,34,1+x%3,148);
    c.fillRect(20,201,86,4);c.fillRect(20,214,72,3);
  });
  print("rear_serial",.014,.038,serial,-.006,.234,-.2378,Math.PI);
  box("power_socket",.031,.024,.012,edge,.070,.112,-.247);
  box("power_plug",.023,.017,.022,inset,.070,.112,-.258);
  box("tuner_panel",.212,.034,.004,inset,0,.084,-.245);
  for(const [x,color] of [[-.094,"#a14536"],[-.082,"#aaa9a0"],[-.070,"#b1a268"]]){
    disc("rca_ring",.0042,.0026,plastic("RCA ring",color),x,.078,-.249);
    disc("rca_socket",.0022,.0030,shadow,x,.078,-.250);
  }
  disc("tuner_coax",.0052,.016,silver,-.016,.084,-.254);
  disc("coax_plug",.0049,.014,inset,-.016,.084,-.263);
  for(const x of [.023,.039,.055]) disc("serial_port",.0047,.0025,shadow,x,.081,-.249);
  box("scsi_socket",.034,.008,.003,edge,.084,.081,-.250);
}
