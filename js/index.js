"use strict";
(function() {
  /**
   * @param  {HTMLElement} element
   * @param  {string} url
   * @param  {function} [handle]
   * @param  {function} [callback]
   */
  function loadPage(element, url, handle, callback) {
    getText(url, function(data) {
      if(typeof handle === "function"){
        var tempElement=document.createElement("div");
        tempElement.innerHTML=data;
        handle(tempElement);
      }else{
        element.innerHTML = data;
      }
      if (typeof callback === "function") {
        callback();
      }
    });
  }
  
  /**
   * @param {string} url 
   * @param {function} callback 
   */
  function getJson(url, callback) {
    getText(url, function(data) {
      callback(JSON.parse(data));
    });
  }

  /**
   * @param  {string} url
   * @param  {function} callback
   */
  function getText(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("get", url);
    xhr.responseType = "text";
    xhr.addEventListener("load", function() {
      if (this.status === 200 || this.status === 304) {
        callback(this.response);
      }
    });
    xhr.send();
  }
  /**
   * @param {string} [attribute]
   * @returns {object|string}
   */
  function getSearch(attribute){
    var search=location.search.substring(1);
    var array=search.split("&");
    var ret={};
    for(var i=0;i<array.length;i++){
      var equal=array[i].indexOf("=");
      if(equal>=0){
        var attr=array[i].substring(0,equal);
        var value=array[i].substring(equal+1);
      }else{
        attr=array[i];
        value=null;
      }
      ret[attr]=value;
    }
    if(typeof attribute==="string"){
      return ret[attribute];
    }
    return ret;
  }
  getJson("data/config.json", function(config) {
    config.language = config.defaultLanguage;
    for (var i in config.languageList[config.language]) {
      config[i] = config.languageList[config.language][i];
    }
    var via=getSearch("via");
    if(config.permissionList[via]){
      config.permission=config.permissionList[via];
    }else{
      config.permission=config.permissionList.default
    }
    var header = document.createElement("header");
    var content = document.createElement("div");
    content.className = "content";
    document.body.appendChild(header);
    document.body.appendChild(content);
    loadPage(header, "pages/header.html", function(element){
      getJson(config.information,function(data){
        element.querySelector(".introduction-header .name").textContent=config.permission.name?data[0].content:data[1].content;
        element.querySelector(".introduction-header .position").textContent=config.permission.position?data[2].content:"";
        var introductionList=element.querySelector(".introduction-list");
        var informationModel=introductionList.querySelector("li").cloneNode(true);
        introductionList.innerHTML="";
        for (var i=3;i<data.length;i++) {
          (function(){
            if (config.permission[data[i].name]) {
              var element = informationModel.cloneNode(true);
              element.querySelector(".item-name").textContent=data[i].name;
              var detail=element.querySelector(".item-detail");
              if(data[i].link){
                var a =document.createElement("a");
                a.href=data[i].link;
                a.textContent=data[i].content;
                if(data[i].target){
                  a.target=data[i].target;
                }
                detail.innerHTML="";
                detail.appendChild(a);
              }else{
                detail.textContent=data[i].content;
              }
          
              introductionList.appendChild(element);
            }
          })();
        
        }
        header.innerHTML=element.innerHTML;

      });
      
    });
    loadPage(content, "pages/home.html", function(element) {
      var intention = element.querySelector('[data-part="intention"]');
      var skill = element.querySelector('[data-part="skill"]');
      var selfAssessment = element.querySelector('[data-part="self-assessment"]');
      var workExperience = element.querySelector('[data-part="work-experience"]');
      var projectExperience = element.querySelector('[data-part="project-experience"]');
      getJson(config.resume, function(data) {
        var parts = {
          intention: intention,
          skill: skill,
          selfAssessment: selfAssessment,
          workExperience: workExperience,
          projectExperience: projectExperience
        };
        for (var i in parts) {
          parts[i].querySelector("h3").textContent = data.title[i];
        }

        var intentionData = data.intention;
        var intentionContent = document.createElement("ul");
        for (var i = 0; i < intentionData.length; i++) {
          var li = document.createElement("li");
          li.textContent = intentionData[i].name + config.colon + intentionData[i].content;
          intentionContent.appendChild(li);
        }
        intention.appendChild(intentionContent);

        var skillContentText = "";
        for (var i = 0; i < data.skill.length; i++) {
          if (i !== 0) {
            skillContentText += config.separator;
          }
          skillContentText += data.skill[i].name;
        }
        skillContentText += config.period;
        skill.querySelector("p").textContent = skillContentText;

        for(var i=0;i<data.selfAssessment.length;i++){
          var div=document.createElement("div");
          div.textContent=data.selfAssessment[i];
          selfAssessment.appendChild(div);
        }

        var workExperienceContent=workExperience.querySelector("section>ul");
        var workExperienceModel=workExperienceContent.querySelector("ul>li").cloneNode(true);
        workExperienceContent.innerHTML="";
        /**
         * @param  {object} data
         * @returns {HTMLElement|undefined}
         */
        function createWorkExperience(data){
          if(!data.visible){
            return;
          }
          var li=workExperienceModel.cloneNode(true);
          li.setAttribute("dataset-work-id",data.workId);
          li.querySelector(".name").textContent=data.companyName;
          li.querySelector(".date-begin").textContent=data.beginDate;
          li.querySelector(".date-end").textContent=data.endDate;
          li.querySelector("p").textContent=data.workDescription;
          return li;
        }
        for(var i=0;i<data.workExperience.length;i++){
          var li=createWorkExperience(data.workExperience[i]);
          if(li){
            workExperienceContent.appendChild(li);
          }
        }

        var projectExperienceContent=projectExperience.querySelector("section>ul");
        var projectExperienceModel=projectExperienceContent.querySelector("ul>li").cloneNode(true);
        projectExperienceContent.innerHTML="";
        /**
         * @param  {object} data
         * @returns {HTMLElement|undefined}
         */
        function createProjectExperience(data){
          if(!data.visible){
            return;
          }
          var li=projectExperienceModel.cloneNode(true);
          li.setAttribute("dataset-project-id",data.projectId);
          li.querySelector(".name").textContent=data.projectName;
          li.querySelector(".date-begin").textContent=data.beginDate;
          li.querySelector(".date-end").textContent=data.endDate;
          for (var i = 0; i < data.detail.length; i++) {
            var div = document.createElement("div");
            div.textContent=data.detail[i];
            li.appendChild(div);
          }
          if(data.projectLinkVisible && data.projectLink){
            var div = document.createElement("div");
            var a=document.createElement("a");
            a.textContent=data.projectLink;
            a.href=data.projectLink;
            a.target="_blank";
            div.appendChild(a);
            li.appendChild(div);
          }
          return li;
        }
        for(var i=data.projectExperience.length-1;i>=0;i--){
          var li=createProjectExperience(data.projectExperience[i]);
          if(li){
            projectExperienceContent.appendChild(li);
          }
        }
        

        content.innerHTML=element.innerHTML;
      });
    });
  });
})();
