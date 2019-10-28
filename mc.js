//Version: 201604132300
//File: mc.js
//Description: Core functions for Myanmar Calendrical Calculations
//-------------------------------------------------------------------------
//WebSite: mc1500.com
//Myanmar Calendrical Calculations by mc1500 is licensed under the
//     Creative Commons Attribution 4.0 International License.
//To view a copy of this license, visit
//    http://creativecommons.org/licenses/by/4.0/.
//  You are free to:
//   Share — copy and redistribute the material in any medium or format
//   Adapt — remix, transform, and build upon the material
//                   for any purpose, even commercially.
//  Under the following terms:
//   Attribution — You may give appropriate credit, provide a link to the license,
//                   but it is not compulsory.
//-------------------------------------------------------------------------
//Usage example to calculate Myanmar calendar date 
// j=w2j(year,month,day); //get julian day number
// M=j2m(j); //get Myanmar date
// Then
//     M.my = Myanmar year
//     M.mm = Myanmar month [1=Tagu, 2=Kason, etc...]
//     M.mp = [0=waxing, 1=full moon, 2=waning, or 3=new moon]
//     M.d = fortnight day


//Start of kernel #############################################################

//-------------------------------------------------------------------------
//Check watat (intercalary month)
//input: (my -myanmar year,
  //  rf - referred source [Optional argument: 0=Evidence based (default), 1=Tin Naing Toe])
//output:  ( watat - intercalary month [1=watat, 0=regular]
  //  fm - full moon day of 2nd Waso in jdn [valid for watat years only])
//dependency: chk_exception(my,rf,fm,watat,ei)
function chk_watat(my,rf) { rf=rf||0;
	var SY=1577917828/4320000; //solar year (365.2587565)
	var LM=1577917828/53433336; //lunar month (29.53058795)
	var MO=1954168.050623; //beginning of 0 ME
	// [<1100 ME - 1st era early], [<1217 ME - 1st era late],
	//[<1312 ME - 2nd era],[>=1312 ME - 3rd era]
	var e1=(my>=1100)?1:0; var e2=(my>=1217)?1:0; var e3=(my>=1312)?1:0;
	var ei=e1+e2+e3; 
	var NM=e2*5+e3*4-1;//number of months to find excess days
	//offset to adjust full moon day depending on era
	var WO=e1*0.25-e2*0.15+e3*0.5-1.1; 
	var TA=(SY/12-LM)*(12-NM); //threshold to adjust
	var ed=(SY*(my+3739))%LM; // excess day
	if(ed<TA) ed+=LM;//adjust excess days
	var fm=Math.round(SY*my+MO-ed+4.5*LM+WO);//full moon day of 2nd Waso 
	var TW=0,watat=0;//find watat 
	if (ei>=2) {//if 2nd era or later find watat based on excess days
		TW=LM-(SY/12-LM)*NM; watat=(ed>=TW); } 
	else {//if 1st era,find watat by 19 years metonic cycle
//Myanmar year is divided by 19 and there is intercalary month
//if the remainder is 2,5,7,10,13,15,18
//https://github.com/kanasimi/CeJS/blob/master/data/date/calendar.js#L2330
		watat=(my*7+2)%19; if (watat<0) watat+=19;
		watat=Math.floor(watat/12);	}  
	return chk_exception(my,rf,fm,watat,ei);
}
//-------------------------------------------------------------------------
//Check exception for full moom day and watat (intercalary month)
//input: (my -myanmar year,
  //  rf - referred source [0=Evidence based, 1=Tin Naing Toe],
  //  watat - intercalary month [1=watat, 0=regular]
  //  fm - full moon day of 2nd Waso in jdn [valid for watat years only],
  //  ei - era index [0=1st era early, 1=1st era late, 2=2nd era, 3=3rd era])
//output:  ( watat - corrected intercalary month [1=watat, 0=regular]
  //  fm - corrected full moon day of 2nd Waso in jdn [valid for watat years only])
//external variables:
   //	Exceptions for well known years
var fm1=[[1120,1],[1126,-1],[1150,1],[1172,-1],[1207,1],[1234,1],[1261,-1],[1377,1]];
var wt1=[ [1201,1],[1202,0],[1263,1],[1264,0],[1344,1],[1345,0]];
  //
  //	Exceptions for the earlier years (older than 300 years)
  //		Ref 0: Evidence based- Based on various evidence such as inscriptions, books, etc...
var fmCE=[[205,1],[246,1],[572,-1],[651,1],[653,2],[656,1],[672,1],[729,1],
	  [767,-1],[813,-1],[849,-1],[851,-1],[854,-1],[927,-1],[933,-1],[936,-1],[938,-1],
	  [949,-1],[952,-1],[963,-1],[968,-1],[1039,-1]];
  //		Ref 1: Tin Naing Toe & Dr. Than Tun
var fmTNT=[[205,1],[246,1],[813,-1],[854,-1],[1039,-1]];
function chk_exception(my,rf,fm,watat,ei){ var i=0;
	if (ei){ //adjust for exceptions for well known years
		i=bSearch(my,wt1); if (i>=0) watat=wt1[i][1];
		if(watat) {i=bSearch(my,fm1); if(i>=0) fm+=fm1[i][1]; }}
	else if(watat){ //for the first era earlier years, use referred sources
	//to adjust for exceptions 
		if (rf==1) {// Tin Naing Toe & Dr. Than Tun
			i=bSearch(my,fmTNT); if(i>=0) fm+=fmTNT[i][1]; 	}
		else {// Cool Emerald- Based on various evidence
		//such as inscriptions, books, etc...
			i=bSearch(my,fmCE); if(i>=0) fm+=fmCE[i][1]; 	}	} 
	return {fm:fm,watat:watat};
}
//-------------------------------------------------------------------------
//Check Myanmar Year
//input: (my -myanmar year,
  // rf - referred source [Optional argument: 0=Evidence based (default), 1=Tin Naing Toe])
//output:  (myt :year type [0=regular, 1=little watat, 2=big watat],
  //tg1 : the 1st day of Tagu as Julian Day Number
  //fm : full moon day of [2nd] Waso as Julain Day Number)
  //werr: watat error
//dependency: chk_watat(my,rf)
function chk_my(my,rf) { rf=rf||0; 
	var yd=0,y1,nd=0,werr=0,fm=0;
	var y2=chk_watat(my,rf); var myt=y2.watat;
	do{ yd++; y1=chk_watat(my-yd,rf);}while(y1.watat==0 && yd<3);
	if(myt) { nd=(y2.fm-y1.fm)%354; myt=Math.floor(nd/31)+1;
		fm=y2.fm; if(nd!=30 && nd!=31) {werr=1;} }
	else fm=y1.fm+354*yd;
	var tg1=y1.fm+354*yd-102;	
	return {myt:myt,tg1:tg1,fm:fm,werr:werr};
}
//-------------------------------------------------------------------------
//Julian date to Myanmar date
//input: (jd -julian date,
  // rf - referred source [Optional argument: 0=Evidence based (default), 1=Tin Naing Toe])
//output:  (my : year,
  //myt :year type [0=regular, 1=little watat, 2=big watat],
  //myl: year length [354, 384, or 385 days],
  //mm: month [1=Tagu, 2=Kason, etc...],
  //mmt: month type [1=hnaung, 0= Oo],
  //mml: month length [29 or 30 days],
  //md: month day [1 to 30],
  //fd: fortnight day [1 to 15],
  //mp :moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon],
  //wd: week day [0=sat, 1=sun, ..., 6=fri] )
//dependency: chk_my(my,rf)
function j2m(jd,rf) {
	var SY=1577917828/4320000; //solar year (365.2587565)
	var MO=1954168.050623; //beginning of 0 ME
	var jdn,my,yo,dd,myl,mmt,a,b,c,mm,md,mml,mp,fd,wd;
	rf=rf||0; jdn=Math.round(jd);//convert jd to jdn
	my=Math.floor((jdn-0.5-MO)/SY);//Myanmar year
	yo=chk_my(my,rf);//check year
	dd=jdn-yo.tg1+1;//day count
	b=Math.floor(yo.myt/2); c=Math.floor(1/(yo.myt+1)); //big wa and common yr
	myl=354+(1-c)*30+b;//year length
	mmt=Math.floor((dd-1)/myl);//month type: Hnaung =1 or Oo = 0
	dd-=mmt*myl; a=Math.floor((dd+423)/512); //adjust day count and threshold
	mm=Math.floor((dd-b*a+c*a*30+29.26)/29.544);//month
	e=Math.floor((mm+12)/16); f=Math.floor((mm+11)/16);
    md=dd-Math.floor(29.544*mm-29.26)-b*e+c*f*30;//day
    mm+=f*3-e*4; mml=30-mm%2;//adjust month and month length
	if(mm==3) mml+=b;//adjust if Nayon in big watat
	mp=Math.floor((md+1)/16)+Math.floor(md/16)+Math.floor(md/mml);
	fd=md-15*Math.floor(md/16);//waxing or waning day
	wd=(jdn+2)%7;//week day
	return {my:my,myt:yo.myt,myl:myl,mm:mm,mmt:mmt,mml:mml,md:md,
		mp:mp,fd:fd,wd:wd};
}
//-------------------------------------------------------------------------
//Myanmar date to Julian date
//input:  (my : year,
  //mm: month [1=Tagu, 2=Kason, etc...],
  //mmt: month type [1=hnaung, 0=Oo],
  //mp :moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon],
  //fd: fortnight day [1 to 15],
  //rf - referred source [Optional argument: 0=Evidence based (default), 1=Tin Naing Toe])
//output: (jd -julian day number)
//dependency: chk_my(my,rf)
function m2j(my,mm,mmt,mp,fd,rf) {
	var b,c,mml,m1,m2,md,dd;
	rf=rf||0; yo=chk_my(my);//check year
	b=Math.floor(yo.myt/2); c=(yo.myt==0); //if big watat and common year
	mml=30-mm%2;//month length
	if (mm==3) mml+=b;//adjust if Nayon in big watat
	m1=mp%2; m2=Math.floor(mp/2); md=m1*(15+m2*(mml-15))+(1-m1)*(fd+15*m2);
	mm+=4-Math.floor((mm+15)/16)*4+Math.floor((mm+12)/16);//adjust month
	dd=md+Math.floor(29.544*mm-29.26)-c*Math.floor((mm+11)/16)*30
		+b*Math.floor((mm+12)/16);
	myl=354+(1-c)*30+b;//year length
	dd+=mmt*myl;//adjust day count
	return dd+yo.tg1-1;
}
//-------------------------------------------------------------------------
//Julian date to Western date
//Credit4 Gregorian date: http://pmyers.pcug.org.au/General/JulianDates.htm
//Credit4 Julian Calendar: http://quasar.as.utexas.edu/BillInfo/JulianDatesG.html
//input: (jd:julian date,
  // ct:calendar type [Optional argument: 0=english (default), 1=Gregorian, 2=Julian]
  // SG: Beginning of Gregorian calendar in JDN [Optional argument: (default=2361222)])
//output: Western date (y=year, m=month, d=day, h=hour, n=minute, s=second)
function j2w(jd,ct,SG) {
	ct=ct||0; SG=SG||2361222;//Gregorian start in English calendar (1752/Sep/14)
	var j,jf,y,m,d,h,n,s;
	if (ct==2 || (ct==0 && (jd<SG))) {
		var b,c,f,e;
		j=Math.floor(jd+0.5); jf=jd+0.5-j;
		b=j+1524; c=Math.floor((b-122.1)/365.25); f=Math.floor(365.25*c);
		e=Math.floor((b-f)/30.6001); m=(e>13)?(e-13):(e-1);
		d=b-f-Math.floor(30.6001*e); y=m<3?(c-4715):(c-4716);
	}
	else{
		j=Math.floor(jd+0.5); jf=jd+0.5-j; j-=1721119;
		y=Math.floor((4*j-1)/146097); j=4*j-1-146097*y; d=Math.floor(j/4);
		j=Math.floor((4*d+3)/1461); d=4*d+3-1461*j;
		d=Math.floor((d+4)/4); m=Math.floor((5*d-3)/153); d=5*d-3-153*m;
		d=Math.floor((d+5)/5); y=100*y+j;
		if(m<10) {m+=3;}
		else {m-=9; y=y+1;}		
	}
	jf*=24; h=Math.floor(jf); jf=(jf-h)*60; n=Math.floor(jf); s=(jf-n)*60;
	return {y:y,m:m,d:d,h:h,n:n,s:s};
}
//-------------------------------------------------------------------------
//Western date to Julian day number
//Credit4 Gregorian 2 JD: http://www.cs.utsa.edu/~cs1063/projects/Spring2011/Project1/jdn-explanation.html
//input: (y: year, m: month, d: day,
  // ct:calendar type [Optional argument: 0=english (default), 1=Gregorian, 2=Julian]
  // SG: Beginning of Gregorian calendar in JDN [Optional argument: (default=2361222)])
//output: Julian day number
function w2j(y,m,d,ct,SG) {
	ct=ct||0; SG=SG||2361222;//Gregorian start in English calendar (1752/Sep/14)
	var a=Math.floor((14-m)/12); y=y+4800-a; m=m+(12*a)-3;
	var jd=d+Math.floor((153*m+2)/5)+(365*y)+Math.floor(y/4);
	if (ct==1) jd=jd-Math.floor(y/100)+Math.floor(y/400)-32045;
	else if (ct==2) jd=jd-32083;
	else {
		jd=jd-Math.floor(y/100)+Math.floor(y/400)-32045;
		if(jd<SG) {
			jd=d+Math.floor((153*m+2)/5)+(365*y)+Math.floor(y/4)-32083;
			if(jd>SG) jd=SG;
		}
	}
	return jd;
}
//-------------------------------------------------------------------------
//Time to Fraction of day starting from 12 noon
//input: (h=hour, n=minute, s=second) output: (d: fraction of day)
function t2d(h,n,s) { return ((h-12)/24+n/1440+s/86400);}
//-------------------------------------------------------------------------
//Checking Astrological days
//input: (mm=month, mml= length of the month,md= day of the month [0-30], wd= weekday)
//output: (sabbath, sabbatheve,yatyaza,pyathada,thamanyo,amyeittasote,
//	warameittugyi,warameittunge,yatpote,thamaphyu,nagapor,yatyotema,
//	mahayatkyan,shanyat,nagahle [0=west, 1=north, 2=east, 3=south])
// More details @ http://cool-emerald.blogspot.sg/2013/12/myanmar-astrological-calendar-days.html
function astro(mm,mml,md,wd) {
	var d,sabbath,sabbatheve,yatyaza,pyathada,thamanyo,amyeittasote;
	var warameittugyi,warameittunge,yatpote,thamaphyu,nagapor,yatyotema;
	var mahayatkyan,shanyat,nagahle,m1,wd1,wd2,wda,sya;
	if (mm<=0) mm=4;//first waso is considered waso
	d=md-15*Math.floor(md/16);//waxing or waning day [0-15]
	sabbath=0; if((md==8)||(md==15)||(md==23)||(md==mml)) sabbath=1;
	sabbatheve=0;if((md==7)||(md==14)||(md==22)||(md==(mml-1))) sabbatheve=1;
	yatyaza=0; m1=mm%4; wd1=Math.floor(m1/2)+4;
	wd2=((1-Math.floor(m1/2))+m1%2)*(1+2*(m1%2)); 
	if((wd==wd1)||(wd==wd2)) yatyaza=1;
	pyathada=0; wda=[1,3,3,0,2,1,2]; if(m1==wda[wd]) pyathada=1;
	if((m1==0)&&(wd==4)) pyathada=2;//afternoon pyathada
	thamanyo=0; m1=mm-1-Math.floor(mm/9); wd1=(m1*2-Math.floor(m1/8))%7;
	wd2=(wd+7-wd1)%7; if(wd2<=1) thamanyo=1;
	amyeittasote=0; wda=[5,8,3,7,2,4,1]; if(d==wda[wd]) amyeittasote=1;
	warameittugyi=0; wda=[7,1,4,8,9,6,3]; if(d==wda[wd]) warameittugyi=1;
	warameittunge=0; wn=(wd+6)%7; if((12-d)==wn) warameittunge=1;
	yatpote=0; wda=[8,1,4,6,9,8,7]; if(d==wda[wd]) yatpote=1; 
	thamaphyu=0; wda=[1,2,6,6,5,6,7];  if(d==wda[wd]) thamaphyu=1;
	wda=[0,1,0,0,0,3,3]; if(d==wda[wd]) thamaphyu=1;
	if((d==4) && (wd==5)) thamaphyu=1;
	nagapor=0; wda=[26,21,2,10,18,2,21];  if(md==wda[wd]) nagapor=1;
	wda=[17,19,1,0,9,0,0]; if(md==wda[wd]) nagapor=1;
	if(((md==2)&&(wd==1))||(((md==12)||(md==4)||(md==18))&&(wd==2)))nagapor=1;
	yatyotema=0; m1=(mm%2)?mm:((mm+9)%12); m1=(m1+4)%12+1; if(d==m1)yatyotema=1;
	mahayatkyan=0; m1=(Math.floor((mm%12)/2)+4)%6+1; if(d==m1) mahayatkyan=1;
	shanyat=0; sya=[8,8,2,2,9,3,3,5,1,4,7,4]; if(d==sya[mm-1]) shanyat=1;
	nagahle=Math.floor((mm%12)/3);
	
	return {sabbath:sabbath,sabbatheve:sabbatheve,yatyaza:yatyaza,
	pyathada:pyathada,thamanyo:thamanyo,amyeittasote:amyeittasote,
	warameittugyi:warameittugyi,warameittunge:warameittunge,
	yatpote:yatpote,thamaphyu:thamaphyu,nagapor:nagapor,
	yatyotema:yatyotema,mahayatkyan:mahayatkyan,shanyat:shanyat,
	nagahle:nagahle};
}
//----------------------------------------------------------------------------
//find the length of a month
//input: (y=year, m=month [Jan=1, ... , Dec=12],
//t: calender type [0=English, 1=Gregorian, 2=Julian])
//output: (l = length of the month)
function emLen(y,m,t) {
	var leap=0; var mLen=30+(m+Math.floor(m/8))%2;//length of the current month
    if(m==2) { //if  february
		if(t==1 || (t==0 && y>1752)) {
			if((y%4==0 && y%100!=0) || y%400==0) leap=1;
		}
		else if(y%4==0) leap=1;
		mLen+=leap-2; 
	} 
	if (y==1752 && m==9 && t==0) mLen=19;
	return mLen;
}
//End of kernel ###############################################################

//Start of checking holidays ##################################################

//input: (jdn=Julian Day Number to check, my=myanmar year, mmt=myanmar month type [oo=0, hnaung=1])
//output: (h=flag [true=1, false=0], hs=string)
function thingyan(jdn,my,mmt) {
	var SY=1577917828/4320000; //solar year (365.2587565)
	var MO=1954168.050623; //beginning of 0 ME
	var BGNTG=1100;//start of Thingyan
	var h=0; var hs=["","",""];
	var atat, akn, atn; var SE3=1312; //start of third era
	ja=SY*(my+mmt)+MO;
	if (my >= SE3) jk=ja-2.169918982;
	else jk=ja-2.1675;
	akn=Math.round(jk); atn=Math.round(ja);
	if(jdn==(atn+1)) {hs[h++]="Myanmar New Year Day";}
	if ((my+mmt)>=BGNTG) {
		if(jdn==atn) {hs[h++]="Thingyan Atat";}
		else if((jdn>akn)&&(jdn<atn)) {hs[h++]="Thingyan Akyat";}
		else if(jdn==akn) {hs[h++]="Thingyan Akya";}
		else if(jdn==(akn-1)) {hs[h++]="Thingyan Akyo";}
		else if(((my+mmt)>=1362)&&((jdn==(akn-2))||
			((jdn>=(atn+2))&&(jdn<=(akn+7))))) {hs[h++]="Holiday";}
	}
	return {h:h,hs:hs};
}
//----------------------------------------------------------------------------
//input: (gy=year, gm=month [Jan=1, ... , Dec=12], gd: day [0-31])
//output: (h=flag [true=1, false=0], hs=string)
function ehol(gy,gm,gd) {
	var h=0; var hs=["","",""];
	if((gm==1) && (gd==1)) {hs[h++]="New Year Day";}
	else if((gy>=1948) && (gm==1) && (gd==4)) {hs[h++]="Independence Day";}
	else if((gy>=1947) && (gm==2) && (gd==12)) {hs[h++]="Union Day";}
	else if((gy>=1958) && (gm==3) && (gd==2)) {hs[h++]="Peasants Day";}
	else if((gy>=1945) && (gm==3) && (gd==27)) {hs[h++]="Resistance Day";}
	else if((gy>=1923) && (gm==5) && (gd==1)) {hs[h++]="Labour Day";}
	else if((gy>=1947) && (gm==7) && (gd==19)) {hs[h++]="Martyrs Day";} 
	else if((gm==12) && (gd==25)) {hs[h++]="Christmas Day";}
	else if((gy>=2008) && (gm==12) && (gd==28)) {hs[h++]="Mon Youth Day";}
	return {h:h,hs:hs};
}
//----------------------------------------------------------------------------
//input: (my=year, mm=month [Tagu=1, ... , Tabaung=12], md: day [0-30],
//mp :moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon])
//output: (h=flag [true=1, false=0], hs=string)
function mhol(my,mm,md,mp) {
	var h=0; var hs=["","",""];
	if((mm==2) && (mp==1)) {hs[h++]="Buddha Day";}//Vesak day
	else if((mm==4)&& (mp==1)) {hs[h++]="Start of Buddhist Lent";}//Warso day
	else if((mm==7) && (mp==1)) {hs[h++]="End of Buddhist Lent";}
	else if((mm==8) && (mp==1)) {hs[h++]="Tazaungdaing";}
	else if((my>=1282) && (mm==8) && (md==25)) {hs[h++]="National Day";}
	else if((mm==10) && (md==1)) {hs[h++]="Karen New Year Day";}
	else if((mm==12) && (mp==1)) {hs[h++]="Tabaung Pwe";}
	return {h:h,hs:hs};
}
//----------------------------------------------------------------------------
//input: (j: Julian Day Number, 
// ct:calendar type [Optional argument: 0=english (default), 1=Gregorian, 2=Julian])
//output: (h=flag [true=1, false=0], hs=string)
//dependency: DoE(), j2w()
//external variables: ghEid2,ghCNY
var ghEid2=[2456936,2457290,2457644];
var ghCNY=[2456689,2456690,2457073,2457074,2457427,2457428];
function ecd(j,ct) {
	ct=ct||0; var h=0; var hs=["","",""];
	var g=j2w(j,ct);
	var doe=DoE(g.y);
	if((g.y>=1915) && (g.m==2) && (g.d==13)) {hs[h++]="G. Aung San BD";}
	else if((g.y>=1969) && (g.m==2) && (g.d==14)) {hs[h++]="Valentines Day";}
	else if((g.y>=1970) && (g.m==4) && (g.d==22)) {hs[h++]="Earth Day";}
	else if((g.y>=1392) && (g.m==4) && (g.d==1)) {hs[h++]="April Fools Day";}
	else if((g.y>=1948) && (g.m==5) && (g.d==8)) {hs[h++]="Red Cross Day";}
	else if((g.y>=1994) && (g.m==10) && (g.d==5)) {hs[h++]="World Teachers Day";}
	else if((g.y>=1947) && (g.m==10) && (g.d==24)) {hs[h++]="United Nations Day";}
	else if((g.y>=1753) && (g.m==10) && (g.d==31)) {hs[h++]="Halloween";}
	if((g.y>=1876) && (j==doe)) {hs[h++]="Easter";}
	else if((g.y>=1876) && (j==(doe-2))) {hs[h++]="Good Friday";}	
	else if(bSearch1(j,ghEid2)>=0) {hs[h++]="Eid";}
	if(bSearch1(j,ghCNY)>=0) {hs[h++]="Chinese New Year";}
	return {h:h,hs:hs};
}
//----------------------------------------------------------------------------
//DoE : Date of Easter using  "Meeus/Jones/Butcher" algorithm
//Reference: Peter Duffett-Smith, Jonathan Zwart',
// "Practical Astronomy with your Calculator or Spreadsheet,"
// 4th Etd, Cambridge university press, 2011. Page-4.

//input: (y=year)
//output: (j=julian day number)
//dependency: w2j()
function DoE(y) {
	a=y%19; 
	b=Math.floor(y/100); c=y%100; 
	d=Math.floor(b/4); e=b%4; 
	f=Math.floor((b+8)/25); 
	g=Math.floor((b-f+1)/3); 
	h=(19*a+b-d-g+15)%30; 
	i=Math.floor(c/4); k=c%4; 
	l=(32+2*e+2*i-h-k)%7; 
	m=Math.floor((a+11*h+22*l)/451); 
	q=h+l-7*m+114; p=(q%31)+1; n=Math.floor(q/31);
	return w2j(y,n,p,1);// this is for Gregorian
}
//----------------------------------------------------------------------------
//input: (my=year, mm=month [Tagu=1, ... , Tabaung=12], md: day [0-30],
//mp :moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon])
//output: (h=number of days, hs=array of string)
function mcd(my,mm,md,mp) {
	var h=0; var hs=["","",""];
	if((my>=1309) && (mm==11) && (md==16))
		{hs[h++]="Mon National Day";}//the ancient founding of Hanthawady
	else if((mm==9) && (md==1)) {hs[h++]="Shan New Year Day";
		if(my>=1306) {hs[h++]="Authors Day";}
	}//Nadaw waxing moon 1
	else if((mm==3) && (mp==1)) {hs[h++]="Mahathamaya Day";}//Nayon full moon
	else if((mm==6)&&(mp==1)){hs[h++]="Garudhamma Day";}//Tawthalin full moon
	else if((my>=1356) && (mm==10) && (mp==1))
		{hs[h++]="Mothers Day";}//Pyatho full moon
	else if((my>=1370) && (mm==12) && (mp==1))
		{hs[h++]="Fathers Day";}//Tabaung full moon
	else if((mm==5) && (mp==1)) {hs[h++]="Metta Day"; 
		 if(my>=1324)  {hs[h++]="Mon Revolution Day";}//Mon Revolution day
	}//Waguang full moon
	else if((mm==5) && (md==10)) {hs[h++]="Taungpyone Pwe";}//Taung Pyone Pwe
	else if((mm==5) && (md==23)) {hs[h++]="Yadanagu Pwe";}//Yadanagu Pwe
    else if((my>=1119) && (mm==2) && (md==23)) {hs[h++]="Mon Fallen Day";}
	else if((mm==4) && (md==5)) {hs[h++]="Mon Sasana Day";}
    else if((mm==12) && (md==12)) {hs[h++]="Mon Women Day";}
	else if((mm==10) && (md==23)) {hs[h++]="Mon National Blood Day";}
	return {h:h,hs:hs};
}
//----------------------------------------------------------------------------
//other holidays
//input: (jd: Julian day number)
//output: (h=flag [true=1, false=0], hs=string)
//external variables: ghDiWali,ghEid
var ghDiwali=[2456599,2456953,2457337,2457691];
var ghEid=[2456513,2456867,2457221,2457576];
function ohol(jd) {
	var h=0; var hs=["","",""];
	if(bSearch1(jd,ghDiwali)>=0) {hs[h++]="Diwali";}
	if(bSearch1(jd,ghEid)>=0) {hs[h++]="Eid";}
	return {h:h,hs:hs};
}
//End of checking holidays ####################################################

//Search first dimension in a 2D array
//input: (k=key,A=array)
//output: (i=index)
function bSearch(k,A) {
	var i=0; var l=0; var u=A.length-1;
	while(u>=l) {
		i=Math.floor((l+u)/2);
		if (A[i][0]>k)  u=i-1;
		else if (A[i][0]<k) l=i+1;
		else return i;
	} return -1;
}
//-----------------------------------------------------------------------------
//Search a 1D array
//input: (k=key,A=array)
//output: (i=index)
function bSearch1(k,A) {
	var i=0; var l=0; var u=A.length-1;
	while(u>=l) {
		i=Math.floor((l+u)/2);
		if (A[i]>k)  u=i-1;
		else if (A[i]<k) l=i+1;
		else return i;
	} return -1;
}
//-----------------------------------------------------------------------------
//Start of Internationalization (language) ####################################
var X;
var g_Lang="Mon";
function LanguageCatalog(a) {X=a;}
//Credit: Mon Language Translation by 'ITVilla' : http://it-villa.blogspot.com/
//and Proof reading by Mikau Nyan

//-------------------------------------------------------------------------
//Select language
//input: (L: number[0=Myanmar, 1=English, 2=Mon, 3=Zawgyi]) 
function SelectLang(L){
	if (L==1 || L=="English" || L=="my-En" || L=="my-en") {g_Lang="English"; }
	else if (L==2 || L=="Myanmar" || L=="my-Myanmar" || L=="my-myanmar") { g_Lang="Myanmar";}
	else if (L==3 || L=="NMon" || L=="my-NMon" || L=="my-nmon") { g_Lang="NMon";}
	else if (L==4 || L=="UniMon" || L=="my-UniMon" || L=="my-unimon") { g_Lang="UniMon";}
	else if (L==5 || L=="Zawgyi" || L=="my-Z1" || L=="my-z1" || L=="Zawgyi-One") { g_Lang="Zawgyi";}
	else {g_Lang="Mon";}
	return g_Lang;
}
//-------------------------------------------------------------------------
//Translate to selected language from a string in English -defined in mc_l.js
//input: (es: text in english) output: (ts: translated text)
function T(es){
	try {
		var ts=X[g_Lang][es];
	}
	catch(err){
		ts=undefined;
	}
	if (ts===undefined) {return es;}
	else return ts;
}
//----------------------------------------------------------------------------
//Convert a number to string in the selected language
//input: (n=number, X: global variable that holds the language catalog)
//output: (s: string)
function n2s(n) { var r=0,s="",g=""; if(n<0){g="-"; n=Math.abs(n);}
n=Math.floor(n); do{ r=n%10; n=Math.floor(n/10);
s=T(r.toString())+s; }while(n>0);  return (g+s); }
//-----------------------------------------------------------------------------
//Get holiday string
//input: hd : holiday object
//output: string
function Holiday2String(hd){ var str=""; var k=0;  for(k=0;k<hd.h;k++) str+=T(hd.hs[k])+" ";  return str; }
//End of Internationalization (language)  #####################################
//-----------------------------------------------------------------------------
//Start of chronical dates ####################################################

//Credit: Thanks to U Aung Zeya for listing and sending most of the chronical dates listed in this calendar.
var g_History;
function ChronicalDates(a) {g_History=a;}

//Month number enumeration
var mme={"First Waso":0,"Tagu":1,"Kason":2,"Nayon":3,"Waso":4,"Wagung":5,"Tawthalin":6,
	"Thadingyut":7,"Tazaungmon":8,"Nadaw":9,"Pyatho":10,"Tabodwe":11,"Tabaung":12,
	"Hnaung Tagu":13,"Hnaung Kason":14,"Late Tagu":13,"Late Kason":14,"Second Waso":15};
	
//Moon phase enumeration
var mpe={"Waxing":0, "Full moon":1, "Waning":2, "New moon":3};

//Week day enumeration
var wde={"Saturday":0, "Sunday":1, "Monday":2, "Tuesday":3, "Wednesday":4, "Thursday":5,"Friday":6};
//-----------------------------------------------------------------------------
//Search jd in chronical dates
//input: (jd=Julian day number)
//output: (i= index, f=flag [0: not found, 1: found], my: Myanmar year,
// myt: Myanmar year type [0: common year, 1: watat],
// mm: Myanmar month, mmt: Myanmar month type [0: Oo, 1: Hnaung],
// mp: moon phase, fd: fortnight day, wd: day of the week,
// dt: description, hl: URL)
function hSearch(jd)
{
	var myt=0,mmt=0,mm=1,ho;
	var ho_mm,ho_mp,ho_fd,ho_my,ho_wd,ho_dt;
	var i=0; var l=0; var u=g_History.length-1; 
	while(u>=l) {		
		i = Math.floor((l+u)/2); // calculate midpoint
		ho=g_History[i];
		if (ho["Julian Day Number"]<jd) l=i+1;
		else if (ho["Julian Day Number"]>jd)  u=i-1;
        else { // found
			ho_mm=mme[ho["Myanmar Month"]];
			ho_mp=mpe[ho["Moon Phase"]];
			ho_fd=ho["Fortnight Day"];
			ho_my=ho["Myanmar Year"];
			ho_wd= wde[ho["Day of the Week"]];
			ho_dt=ho["Description"];
			if(ho_mm==15){myt=1; mm=4;} 
			else {mmt=Math.floor(ho_mm/13); mm=ho_mm%13+mmt;}
			return {i:i,f:1,my:ho_my,myt:myt,mm:mm,mmt:mmt,
				mp:ho_mp,fd:ho_fd,wd:ho_wd,dt:ho_dt};
		}
    }
return {i:-1,f:0,my:0,myt:0,mm:0,mmt:0,mp:0,fd:0,wd:0,dt:""};//not found
}
//End of chronical dates ######################################################

//Start of Rulers in Myanmar history ##########################################
//Description: Rulers (kings) in Myanmar history
//    Ref:
//         https://en.wikipedia.org/wiki/List_of_Burmese_monarchs
//          https://en.wikipedia.org/wiki/List_of_colonial_governors_of_Burma
//          https://en.wikipedia.org/wiki/List_of_Presidents_of_Myanmar
//          https://my.wikipedia.org/wiki/%E1%80%9B%E1%80%81%E1%80%AD%E1%80%AF%E1%80%84%E1%80%BA%E1%80%99%E1%80%84%E1%80%BA%E1%80%B8%E1%80%86%E1%80%80%E1%80%BA
//          https://my.wikipedia.org/wiki/%E1%80%95%E1%80%BB%E1%80%89%E1%80%BA%E1%80%95%E1%80%BC%E1%80%AC%E1%80%B8%E1%80%99%E1%80%84%E1%80%BA%E1%80%B8

var g_RulerList=[];// list of rulers
var g_Rulers;
function Rulers(a) {g_Rulers=a;}
var g_dyn_str={
	"Konbaung":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Konbaung_Dynasty'>Konbaung (ကုန်းဘောင်ခေတ်)</a>",
	"Restored_Hanthawaddy":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Restored_Hanthawaddy_Kingdom'>Restored Hanthawaddy Kingdom (ဟံသာဝတီပဲခူးတိုင်းပြည်)</a>",
	"Taungoo":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Taungoo_Dynasty'>Taungoo (တောင်ငူခေတ်)</a>",
	"Mrauk_U":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Kingdom_of_Mrauk_U'>Mrauk-U Dynasty (မြောက်‌ဦး)</a>",
	"Hanthawaddy":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Hanthawaddy_Kingdom'>Hanthawaddy Dynasty (ဟံသာဝတီ)</a>",
	"Prome":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Prome_Kingdom'>Prome Dynasty (ဒုတိယ သရေခေတ္တရာ)</a>",
	"Ava":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Kingdom_of_Ava'>Ava Dynasty (အင်းဝခေတ်)</a>",
	"Sagaing":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Sagaing_Kingdom'>Sagaing Kingdom (စစ်ကိုင်းခေတ်)</a>",
	"Pinya":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Pinya_Kingdom'>Pinya Kingdom (ပင်းယခေတ်)</a>",
	"Myinsaing":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Myinsaing_Kingdom'>Myinsaing Kingdom (မြင်စိုင်းခေတ်)</a>",
	"Pagan":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Pagan_Kingdom'>Pagan Kingdom (ပုဂံခေတ်)</a>",
	"Early_Pagan":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Early_Pagan_Kingdom'>Early Pagan Kingdom (ခေတ်ဦး ပုဂံ ပြည်)</a>",
	"British_Colonial_Period":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/British_rule_in_Burma'>British Colonial Period (ဗြိတိသျှကိုလိုနီခေတ်)</a>",
	"Japanese_Occupation":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Japanese_occupation_of_Burma'>Japanese Occupation (ဂျပန်ခေတ်)</a>",
	"Union_of_Burma":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Post-independence_Burma,_1948%E2%80%9362'>Union of Burma</a>",
	"Socialist_Republic":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Burmese_Way_to_Socialism'>Socialist Republic of the Union of Burma</a>",
	"Union_of_Myanmar":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/State_Peace_and_Development_Council'>Union of Myanmar</a>",
	"Republic_Myanmar":"<a class='RU_DYN' href='https://en.wikipedia.org/wiki/Myanmar'>Republic of the Union of Myanmar</a>"
};
//-----------------------------------------------------------------------------
//Search jd in ruler records,  input: (jd=Julian day number), output: (no output, just update g_RulerList)
function mc_rSearch(jd)
{	var ro;	var i=0; var u=g_Rulers.length; 
	for(i=0;i<u;i++) { ro=g_Rulers[i]; if (jd>=ro.Beginning_JDN && jd<=ro.Ending_JDN) mc_rPush(ro); }
}
//-----------------------------------------------------------------------------
//Add an entry to ruler records, input: (ro= ruler object), output: (no output, just update ro_list)
function mc_rPush(ro)
{   var i=0; var f=1; var u=g_RulerList.length; 
	for(i=0;i<u;i++) if (ro.Name==g_RulerList[i].Name) f=0; // found
	if (f) g_RulerList[u]=ro;
}
//-----------------------------------------------------------------------------
//Clear ruler records
function mc_rClear() { g_RulerList.length=0; }//g_RulerList.splice(0,g_RulerList.length);
//-----------------------------------------------------------------------------
//check if there is ruler records, input: (no input), output: (length)
function mc_rLength() { return g_RulerList.length; }
//-----------------------------------------------------------------------------
//Get description from g_RulerList, input: (no input), output: (str= description text)
function mc_rDescription() {
	var i=0; var str=""; var u=g_RulerList.length; 
	for(i=0;i<u;i++) str+=mc_rText(g_RulerList[i])+(i==(u-1)?".":",<br/>");
	return str;
}
//-----------------------------------------------------------------------------
//Get description for a record, input: (record), output: (str= description text)
function mc_rText(r) {
	var dt=new Date(); var j=w2j(dt.getFullYear(),(1+dt.getMonth()),dt.getDate());
	var str="<a class='RU_DT' href='"+r.URL+"'>"+r.Name+"</a>";
	str+=", "+mc_j2d(r.Beginning_JDN,0)+" to ";
	str+=(j>r.Ending_JDN)?mc_j2d(r.Ending_JDN,0):" present";
	str+=", "+g_dyn_str[r.Dynasty]; 	return str;
}
//-------------------------------------------------------------------------
// jdn to date string
function mc_j2d(jd,rf) {
	var M=j2m(jd,rf);
	var hmma=["First Waso","Tagu","Kason","Nayon","Waso","Wagaung","Tawthalin",
		 "Thadingyut","Tazaungmon","Nadaw","Pyatho","Tabodwe","Tabaung"];
	var hmpa=["Waxing","Full moon","Waning","New moon"];
	var hwda=['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']; 
	var str="ME "+M.my.toString()+" "; if(M.mmt) str+="Late ";
	if(M.myt && M.mm==4) str+="Second "; str+=hmma[M.mm]+" "+hmpa[M.mp];
	if((M.mp%2)==0) str+=" "+M.fd.toString(); str+=" "+hwda[M.wd];
	return str;
}
//-------------------------------------------------------------------------
//End of Rulers in Myanmar history ############################################