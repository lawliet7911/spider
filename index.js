var cheerio = require("cheerio");
var request = require("request");
var iconv = require("iconv-lite");
var http = require("http");
var fs = require("fs");
//代理
var proxy = require("./utils/proxy");
var target_url = "http://fuliba.net/";
var index = 1;
var count = 0;
var article_links = [];

//获得文章标题和文章链接
getArticleTitle = (url, startPage, endPage) => {
  try {
    http.get(url + "page/" + startPage, res => {
      if (res.statusCode == 404) {
        console.log(--startPage + "页为尾页。");
        saveToLocal("./output/urls.json", JSON.stringify(article_links));
        return;
      }
      //爬取页面内容
      var chunks = [];
      res.on("data", res => {
        chunks.push(res);
      });
      res.on("end", () => {
        var html = iconv.decode(Buffer.concat(chunks), "utf-8");
        var $ = cheerio.load(html, { decodeEntities: false });
        //得到第一页全部页面标题和链接
        $("#content .entry-name a").each((i, el) => {
          var a = $(el);
          article_links.push({
            url: a.attr("href"),
            name: a.html().trim()
          });
        });
        console.log("第" + startPage + "页获取完毕");
        if (startPage < endPage) {
          getArticleTitle(target_url, ++startPage, endPage); //递归查询所有页面链接
        } else {
          console.log(JSON.stringify(article_links));
          getArticleContent(article_links);
          saveToLocal("./output/urls.json", JSON.stringify(article_links));
        }
      });
    });
  } catch (error) {
    console.log("Error:" + error);
  }
  return article_links;
};

//讲爬取的数据保存至本地
var saveToLocal = (filePath, data) => {
  fs.readdir("./", (err, files) => {
    if (err) {
      console.log(err);
    } else {
      if (files.toString().indexOf("output") < 0) {
        fs.mkdir("output", err => {
          if (err) {
            console.log("Error creating dir:" + err);
          } else {
            console.log("Created 'output' success");
            fs.writeFile(filePath, data, err => {
              if (err) {
                console.log(err);
              } else {
                console.log("数据保存成功");
              }
            });
          }
        });
      } else {
        fs.writeFile(filePath, data, err => {
          if (err) {
            console.log(err);
          } else {
            console.log("数据保存成功");
          }
        });
      }
    }
  });
};

//爬取内页数据
var getArticleContent = urlArr => {
  var index = 0; //文章index
  for (index; index < urlArr.length-15; index++) {
    var url = urlArr[index].url;
    let name = urlArr[index].name;
    http.get(url, res => {
      var contentChunk = [];
      res.on("data", (res) => {
        contentChunk.push(res);
      });
      res.on("end", () => {
        var html = iconv.decode(Buffer.concat(contentChunk), "utf-8");
        var $ = cheerio.load(html, { decodeEntities: false });
        var article = $(".entry-content").html();
        saveToLocal("./output/" + name + ".txt", article);
      });
    });
  }

};

var main = () => {
  console.log("开始爬取");
  getArticleTitle(target_url, 1, 1);
};

main();
