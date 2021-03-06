import React from 'react';
import './App.css';
import { Card } from 'antd';
import block from './block.json';
import demoData from './demoCorp.json';

var ply;
var redcircle;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      zoomSize: 0,
      point: null,
      city: "上海市",
      district: "浦东",
      block: "陆家嘴"
    }
  }

  componentDidMount = () => {
    const { BMap } = window;
    this.map = new BMap.Map("baiduMap", { enableMapClick: false });

    let currentCity = "上海市";

    this.map.centerAndZoom(currentCity, 12);
    this.setState({
      zoomSize: 12,
      city: currentCity
    });
    this.map.disableDoubleClickZoom();
    this.map.enableScrollWheelZoom(true);
    this.map.enableContinuousZoom(true);
    this.addMapControl();
    this.map.addEventListener("zoomend",this.zoomChanged);
  }



  
  render() {
    return (
      <div>
        <Card title="地图" extra={this.state.zoomSize} >
          <div id="baiduMap" style={{ height: 800 }}></div>
        </Card>
      </div>
    )
  }


  zoomChanged = () => {
    let map = this.map;
    let currentSize = map.getZoom();
    this.setState({
      zoomSize: currentSize
    });
    if(currentSize <= 13) {
      map.clearOverlays();
      this.drawDistCircle("上海市");
    } else if(currentSize >=15 && currentSize <16) {
      if(this.state.point) {
        this.detailMap(this.state.point,this.state.district);
      }
    } else if(currentSize >=17) {
      if(this.state.point) {
        let detailPoint = this.state.point;
        this.detailCorps(detailPoint.lng,detailPoint.lat,this.state.block);
      }
    } 
  }

  drawDistCircle = (city) => {
    for(let c of block) {
      if(c.city === city) {
        for(let dis of c.distict) {
          this.addDistrictCircle(dis.location.lng,dis.location.lat,dis.boundary,dis.name,Math.ceil(Math.random()*1000));
        }
      }
    }
  }

  drawBlockCircle = (district) => {
    let currentBlock = [];
    for(let d in block) {
      if(block[d].city === this.state.city) {
        for(let b in block[d].distict) {
          if(block[d].distict[b].name === district) {
            currentBlock = block[d].distict[b].blocks;
          }
        }
      }
    }
    for(let b of currentBlock) {
      this.addBlockCircle(b.location.lng,b.location.lat,b.boundary,b.blockName,Math.ceil(Math.random()*1000));
    }
  }

  detailMap = (point,showname) => {
    let map = this.map;
    this.map.centerAndZoom(point, 15);
    this.setState({
      zoomSize: this.map.getZoom(),
      point: point,
      district: showname
    });
    
    map.clearOverlays();
    this.drawBlockCircle(showname);

  }

  detailCorps = (lng,lat,showname) => {
    const { BMap } = window;
    let map = this.map;
    let point = new BMap.Point(lng, lat);
    this.map.centerAndZoom(point, 17);
    this.setState({
      zoomSize: this.map.getZoom(),
      point: point,
      block: showname
    });
    map.clearOverlays();
    for(let corp of demoData) {
      var corpPoint = new BMap.Point(corp.location.lng,corp.location.lat);
      var labelOpts = {
        position: corpPoint,
        offset: new BMap.Size(0,0)
      }
      let label  = new BMap.Label(corp.name,labelOpts);
      label.setStyle({
        color : "green",
        fontSize : "14px",
        height : "20px",
        lineHeight : "20px"
      });
      label.addEventListener("onmouseover",e=>{
        this.openInfoWin(e.currentTarget.point,corp.name);
      });
      map.addOverlay(label);
    }
  }

  setLabels = (point, offsetx, offsety, content) => {
    const { BMap } = window;
    let map = this.map;
    var opts = {
      position: point,    // 指定文本标注所在的地理位置
      offset: new BMap.Size(offsetx, offsety)    //设置文本偏移量
    }
    var label = new BMap.Label(content, opts);  // 创建文本标注对象
    label.setStyle({
      color: "white",
      backgroundColor: "transparent",
      border: "0px",
      fontSize: "13px",
    });
    map.addOverlay(label);
  }


  drawBlockPolygon = (boundary) => {
    const { BMap } = window;
    let map = this.map;
    ply = new BMap.Polygon(boundary, { strokeWeight: 2, strokeColor: "#ff0000" });
    // ply.setFillColor("#fff492");
    // ply.setFillOpacity(0.35);
    map.addOverlay(ply);
  }


  addBlockCircle = (lng,lat,boundary,showname,num) => {
    const { BMap } = window;
    let map = this.map;
    let point = new BMap.Point(lng, lat)
    let circle = new BMap.Circle(point, 300, { fillColor: "green", strokeWeight: 1 });
    var that = this;
    circle.addEventListener("onmouseover",e=>{
      map.removeOverlay(redcircle);
      this.drawBlockPolygon(boundary);
      redcircle = new BMap.Circle(point, 300, { fillColor: "red", strokeWeight: 1 });
      redcircle.addEventListener("click", e => {
        this.setState({
          point: point,
          block: showname
        });
        that.detailCorps(lng,lat,showname); 
      });
      map.addControl(redcircle);      
      this.openInfoWin(point,showname);
    });

    circle.addEventListener("onmouseout",e=>{
      map.removeOverlay(redcircle);
      map.removeOverlay(ply);  
    });
    
    this.setLabels(point, -15, -20, showname);
    this.setLabels(point, -15, 0, num + "家");
    map.addOverlay(circle);
  }

  addDistrictCircle = (lng,lat,boundary,showname,num) => {
    const { BMap } = window;
    let map = this.map;
    let point = new BMap.Point(lng,lat);
    let circle = new BMap.Circle(point, 2000, { fillColor: "green", strokeWeight: 1 });
    let that = this;
    circle.addEventListener("onmouseover",e=>{
      map.removeOverlay(redcircle);
      this.drawBlockPolygon(boundary);
      redcircle = new BMap.Circle(point, 2000, { fillColor: "red", strokeWeight: 1 });
      redcircle.addEventListener("click", e => {
        that.detailMap(point,showname);
      });
      map.addControl(redcircle);        
      this.openInfoWin(point,showname);
    });

    circle.addEventListener("onmouseout",e=>{
      map.removeOverlay(redcircle);
      map.removeOverlay(ply);  
    });

    this.setLabels(point, -15, -20, showname);
    this.setLabels(point, -15, 0, num + "家");
    map.addOverlay(circle);
  }


  openInfoWin=(point,showname)=>{
    const { BMap } = window;
    let map = this.map;
    let infoopts = {
      width: 210, // 信息窗口宽度
      height: 200, // 信息窗口高度
      title: '<h4>'+showname+'</h4>', // 信息窗口标题
      enableMessage: false, //设置允许信息窗发送短息
    }
    let companyContent = "注册资本第一公司: 65656565 <br/>注册资本第二公司: 65656565 <br/>注册资本第三公司: 65656565 <br/>注册资本第四公司: 65656565 <br/>注册资本第五公司: 65656565 <br/>更多>> "
    let infowin = new BMap.InfoWindow(companyContent, infoopts);
    map.openInfoWindow(infowin,point);
  }

  addMapControl = () => {
    let map = this.map;
    var top_right_conntrol = new window.BMap.ScaleControl({ anchor: window.BMAP_ANCHOR_TOP_RIGHT });
    var top_right_navigation = new window.BMap.NavigationControl({ anchor: window.BMAP_ANCHOR_TOP_RIGHT });
    map.addControl(top_right_conntrol);
    map.addControl(top_right_navigation);
    this.drawDistCircle("上海市");
  };
}

export default App;
