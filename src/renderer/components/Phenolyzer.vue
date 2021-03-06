<template>
  <v-layout column justify-center>
    <v-snackbar
        :timeout="snackbarTimeout"
        :top="y === 'top'"
        :bottom="y === 'bottom'"
        :right="x === 'right'"
        :left="x === 'left'"
        :multi-line="mode === 'multi-line'"
        :vertical="mode === 'vertical'"
        v-model="snackbar"
      >
        {{ snackbarText }}
        <v-btn flat color="pink" @click.native="snackbar = false">Close</v-btn>
      </v-snackbar>
      <br>
    <v-flex >
      <v-card>
        <v-card-text >
          <div class="mb-1" >
            Enter phenotype terms in the search box below to use the Phenolyzer tool to generate list of genes.
            Phenolyzer stands for Phenotype Based Gene Analyzer, a tool focusing on discovering genes based on user-specific disease/phenotype terms. <a href="http://phenolyzer.wglab.org/"> Read more</a>
          </div>
          <span >Phenotype: </span>
            <div id="phenotype-input" style="display:inline-block; margin-left:4px;padding-top:5px;">
              <input id="phenotype-term"
                      class="form-control"
                      placeholder="Search phenotype (E.g. lactic acidosis)"
                      v-model="phenotypeTermEntered"
                      type="text">
              <typeahead
                            v-model="phenotypeTerm"
                            hide-details="false"
                            force-select match-start
                            :limit="typeaheadLimit"
                            :async-function="phenotypeLookup"
                            target="#phenotype-term"
                            item-key="value"/>

            </div>
            <v-btn
              style="margin-top:0px"
              color="blue darken-1"
              class="btnColor"
              v-on:click="getPhenotypeData">
            Go
          </v-btn>
          <div v-if="phenolyzerStatus!==null">
            <br>
            <center>
              <v-progress-circular :width="2" indeterminate color="primary"></v-progress-circular>
              The phenolyzer is <strong>{{ phenolyzerStatus }}</strong>
            </center>
          </div>
          <div v-if="multipleSearchTerms.length">
            <v-chip close v-for="(searchItem, i) in multipleSearchTerms" :key="i" @input="remove(searchItem)">
              {{ searchItem }}
            </v-chip>
          </div>
          <div v-if="noResultsArr.length">
            <br>
            Searches with no results:
            <v-chip disabled v-for="(searchItem, i) in noResultsArr" :key="i">
              {{ searchItem }}
            </v-chip>
          </div>
          <p v-if="checked"><v-progress-linear  height="3" color="cyan darken-2" :indeterminate="true"></v-progress-linear></p>
        </v-card-text>
      </v-card>
    </v-flex>
    <v-flex>
      <v-card style="margin-top:4px" v-if="multipleSearchTerms.length">
        <v-card-title primary class="title" >
          <span class="text-xs-center" ><v-chip outline color="primary">{{ selectedGenesText }}</v-chip></span>
          <span  v-if="multipleSearchTerms.length" style="margin-left:20px;display: ">
          <span>
            <v-btn flat @click="copyPhenolyzerGenes"
              ><v-icon style="padding-right:4px">content_copy</v-icon>
              Copy Phenolyzer genes to clipboard</v-btn>
          </span>
            <v-text-field
              append-icon="search"
              label="Search"
              single-line
              hide-details
              v-model="search"
              style="vertical-align:bottom;width: 200px;display:inline-block;margin-left:20px"
            ></v-text-field>
          </span>
        </v-card-title>

        <v-card-text style="padding-top:0px;" v-if="multipleSearchTerms.length">
          <v-data-table
              v-model="selected"
              v-bind:headers="headers"
              v-bind:items="items"
              select-all
              v-bind:pagination.sync="pagination"
              item-key="geneName"
              class="elevation-1"
              v-bind:search="search"
              no-data-text="No pheotype genes Available Currently"
            >
            <template slot="headers" slot-scope="props">
              <tr>
                <th>
                  <v-checkbox
                    primary
                    hide-details
                    @click.native="toggleAll"
                    :input-value="props.all"
                    :indeterminate="props.indeterminate"
                  ></v-checkbox>
                </th>
                <th v-for="header in props.headers" :key="header.text"
                  :class="['column sortable', pagination.descending ? 'desc' : 'asc', header.value === pagination.sortBy ? 'active' : '']"
                  @click="changeSort(header.value)"
                >
                  <v-icon>arrow_upward</v-icon>
                  {{ header.text }}
                </th>
              </tr>
            </template>
            <template slot="items" slot-scope="props">
              <tr :active="props.selected" @click="props.selected = !props.selected">
                <td>
                  <v-checkbox
                    primary
                    hide-details
                    :input-value="props.selected"
                  ></v-checkbox>
                </td>
                <!-- <td></td> -->
                <!-- <td>{{ props.item.rank }}</td> -->
                <td>{{ props.item.rank}}</span></td>
                <td >
                  <div id="app">
                    <div>
                      <v-menu open-on-hover top offset-y>
                        <span style="font-size:13px; margin-top:2px" slot="activator">{{ props.item.geneName }}</span>
                          <div >
                            <v-card>
                              <v-card-text style="margin-top:-25px">
                                <center ><h3>{{ props.item.geneName }}</h3></center>
                                <hr>
                                <div style="width:600px"><strong>Resources: </strong></div>
                                <ul style="margin-left:25px; margin-top:5px">
                                  <li><a v-bind:href="props.item.omimSrc" target="_blank">OMIM</a></li>
                                  <li><a v-bind:href="props.item.medGenSrc" target="_blank">MedGen</a></li>
                                  <li><a v-bind:href="props.item.geneCardsSrc" target="_blank">Gene Cards</a></li>
                                  <li><a v-bind:href="props.item.ghrSrc" target="_blank">Genetics Home Reference</a></li>
                                </ul>
                              </v-card-text>
                            </v-card>
                          </div>
                      </v-menu>
                    </div>
                  </div>
                  <!-- <span style="font-size:13px; margin-top:2px" >{{ props.item.geneName }}</span></td> -->
                <td >
                  <center>{{ props.item.sources }} of {{ multipleSearchTerms.length }}</center>
                  <!--
                  <span>
                    <v-progress-circular
                      :size="25"
                      :width="5"
                      :rotate="-90"
                      :value="props.item.sources / multipleSearchTerms.length * 100"
                      color="light-blue darken-1"
                    >
                    </v-progress-circular>
                  </span>
                -->

                </td>
                <td ><span v-html="props.item.htmlData"></span></td>
                <td style="font-size:0px;">{{ props.item.score }}</td>
              </tr>
            </template>
            <template slot="footer">
            <td colspan="100%">
              <strong>{{ selected.length}} of {{ items.length }} results selected</strong>
            </td>
          </template>
          </v-data-table>
        </v-card-text>

      </v-card>
        </v-flex>
      </v-layout>
</template>

<script>
  import SystemInformation from './WelcomeView/SystemInformation'
  import GeneModel from './GeneModel.js';
  var geneModel = new GeneModel();
  import { Typeahead, Btn } from 'uiv';

  export default {
    name: 'welcome',
    components: {
      SystemInformation,
      Typeahead
     },
    data(){
      return {
        showGenesMenu: null,
        enterCount: 0,
        genesToApply: null,
        genesTopCounts: [5, 10, 30, 50, 80, 100],
        genesTop: 50,
        phenolyzerTopCounts: [30, 50, 80, 100],
        phenolyzerTop: 50,
        phenotypeTerm: "",
        phenotypeTermEntered: "",
        allPhenotypeTerms: [],
        phenolyzerStatus: null,
        hpoLookupUrl:  "http://nv-blue.iobio.io/hpo/hot/lookup/?term=",
        typeaheadLimit: parseInt(100),
        geneList: [],
        //DataTable
        pagination: {
          sortBy: 'rank',
          // descending: true,
          rowsPerPage: 25
        },
        search: '',
        selected: [],
        headers: [
          {
            text: 'Rank',
            align: 'left',
            value: 'rank'
          },
          {
            text: 'Gene',
            align: 'left',
            value: 'geneName'
          },
            {
              text: 'Matched search terms',
              align: 'left',
              value: ['sources', 'omimSrc', 'ghrSrc', 'medGenSrc', 'geneCardsSrc']
             },
             {
               text: 'Phenolyzer score',
               align: 'left',
               value: 'score'
              },
            {
              text: '',
              align: 'left',
              value: 'htmlData'
            }
        ],
        tempItems: [],
        items: [],
        NumberOfTopPhenolyzerGenes: 50,
        selectedGenesText: "",
        checked: false,
        alert:false,
        snackbar: false,
        snackbarText: "",
        multipleSearchTerms: [],
        multipleSearchArray: [],
        y: 'top',
        x: null,
        mode: '',
        snackbarTimeout: 4000,
        dictionaryArr: [],
        noResultsArr: [],
        pieChartdataArr: [],
        typeaheadTerms: []
      }
    },
    updated(){
      this.selectedGenesText= ""+ this.selected.length + " of " + this.items.length + " genes selected";
    },
    watch: {
      genesTop: function() {
        this.selectNumberOfTopPhenolyzerGenes();
      },
      phenotypeTerm: function() {
        if (this.phenotypeTerm && this.phenotypeTerm.label) {
          this.getPhenotypeData();
        }
      }
    },
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
      },
      copyPhenolyzerGenes: function(){
        var geneNames = this.selected.map(gene => {
          return gene.geneName
        })
        var geneNamesToString = geneNames.toString();
        var genesToCopy = geneNamesToString.replace(/,/gi , ' ');
        this.$clipboard(genesToCopy);

        if(this.selected.length>0){
          this.snackbarText = " Number of Genes Copied : " + this.selected.length + " ";
        }
        this.snackbar=true;
      },
      SelectAllPhenolyzerGenes(data){
        this.selected = this.items.slice();
      },
      DeSelectAllPhenolyzerGenes(data){
        this.selected = [];
      },
      filterGenesOnSelectedNumber(data){
        this.selected = this.items.slice(0,data)
      },
      phenotypeLookup: function(term, done) {
        let self = this;

        $.ajax({
            url: self.hpoLookupUrl + encodeURIComponent(term),
            type: 'GET',
            error: function() {
                done([])
            },
            success: function(res) {
              if (!res.length) {
                done([]);
              }
              var sortedTerms = res.sort(function(a,b) {
                if (a.label < b.label) {
                  return -1;
                } else if (a.label > b.label) {
                  return 1;
                } else {
                  return 0;
                }
              });
              console.log(sortedTerms);
              self.typeaheadTerms = sortedTerms;
              done(sortedTerms);
            }
        });
      },
      remove (item) {
        this.items = [];
        this.selected = [];
        this.multipleSearchTerms.splice(this.multipleSearchTerms.indexOf(item), 1)
        this.multipleSearchTerms = [...this.multipleSearchTerms];
        this.dictionaryArr = this.dictionaryArr.filter(term=>term.name!==item);

        var combinedList = this.combineList(this.dictionaryArr);
        var createdObj = this.createObj(combinedList);
        var averagedData = this.performMeanOperation(combinedList, createdObj);
        var sortedPhenotypeData = this.sortTheOrder(averagedData);

        let data = this.drawSvgBars(sortedPhenotypeData);
        this.items = data;
        this.selected = this.items.slice(0,50);
        this.phenolyzerStatus = null;
        this.selectedGenesText= ""+ this.selected.length + " of " + this.items.length + " genes selected";
        this.$emit("UpdatePhenolyzerSelectedGenesText", this.selectedGenesText);
        this.$emit("NoOfGenesSelectedFromPhenolyzer", this.selected.length);
        this.$emit("SelectedPhenolyzerGenesToCopy", this.selected);
      },
      selectNumberOfTopPhenolyzerGenes: function(){
        setTimeout(()=>{
          if(this.genesTop>0){
            // bus.$emit('SelectNumberOfPhenolyzerGenes', this.genesTop);
            this.snackbarText = "Top " + this.genesTop + " genes selected";
            this.snackbar = true;
          }
        }, 1200);

      },
      toggleAll () { //Data Table
        if (this.selected.length) this.selected = []
        else this.selected = this.items.slice()
      },
      changeSort (column) { //Data Table
        if (this.pagination.sortBy === column) {
          this.pagination.descending = !this.pagination.descending
        } else {
          this.pagination.sortBy = column
          this.pagination.descending = false
        }
      },
      getPhenotypeData(){
        let self = this;
        if(self.phenotypeTerm.value.length>1){
          self.checked = true;
          var searchTerm = self.phenotypeTerm.value;
          if(!self.multipleSearchTerms.includes(searchTerm)){
            self.$emit('search-phenotype', self.phenotypeTerm);
            self.phenotypeTermEntered = self.phenotypeTerm.value;
            self.selectedGenesText = "";
            self.phenolyzerStatus = null;
            self.genesToApply = "";
            self.NoOfGenesSelectedFromPhenolyzer = 0;
            this.$emit("SelectedPhenolyzerGenesToCopy", this.selected);
            self.phenotypeTermEntered = self.phenotypeTerm.value;
            geneModel.searchPhenolyzerGenes(searchTerm, this.phenolyzerTop,
            (status, error)=> {
              if (status == 'done') {
                if (geneModel.phenolyzerGenes.length == 0) {
                  self.phenolyzerStatus = "no genes found."
                  self.genesToApply = "";
                  self.checked = false;
                  self.alert = true;
                  self.noResultsArr.push(searchTerm);
                } else {
                  self.tempItems = geneModel.phenolyzerGenes;

                  self.multipleSearchTerms.push(searchTerm)
                  self.checked = false;
                  self.alert = false;
                  self.dictionaryArr.push(({
                    name: searchTerm,
                    data: self.tempItems
                  }))
                  var combinedList = self.combineList(self.dictionaryArr);
                  var createdObj = self.createObj(combinedList);
                  var averagedData = self.performMeanOperation(combinedList, createdObj);
                  var sortedPhenotypeData = self.sortTheOrder(averagedData);
                  self.pieChartdataArr = self.dataForPieChart(sortedPhenotypeData)

                  let data = self.drawSvgBars(sortedPhenotypeData);
                  self.items = data;
                  self.selected = self.items.slice(0,50);
                  self.phenolyzerStatus = null;
                  self.selectedGenesText= ""+ self.selected.length + " of " + self.items.length + " genes selected";
                  self.$emit("UpdatePhenolyzerSelectedGenesText", self.selectedGenesText);
                  self.$emit("NoOfGenesSelectedFromPhenolyzer", self.selected.length);
                  self.$emit("SelectedPhenolyzerGenesToCopy", self.selected);

                }
              } else {
                self.phenolyzerStatus = status;
              }
            });
          }
          else if(self.multipleSearchTerms.includes(searchTerm)){
            self.checked = false;
            self.snackbarText = "This phenotype term is already searched.";
            self.snackbar = true;
          }
          // self.multipleSearchTerms.push(self.phenotypeTerm.value);

        }
      },
      combineList(arr){
        var temp =[];
          for(var i=0; i<arr.length; i++){
            for(var j=0; j<arr[i].data.length; j++){
              temp.push({
                geneName: arr[i].data[j].geneName,
                geneIntoleranceScore: arr[i].data[j].geneIntoleranceScore,
                score: Number(arr[i].data[j].score),
                searchTerm: arr[i].name
              })
            }
          }
          return temp;
      },
      createObj(arr){
        let obj={};
        for(var i=0; i<arr.length; i++){
          if(obj[arr[i].geneName]===undefined){
            obj[arr[i].geneName] = 1;
          }
          else {
            obj[arr[i].geneName]++;
          }
        }
        var uniqueGenes = Object.keys(obj);
        return uniqueGenes
      },
      performMeanOperation: function(arr, uniqueGenes){
        var obj ={};
        for(var i=0; i<uniqueGenes.length; i++){
          for(var j=0; j<arr.length; j++){
            if(uniqueGenes[i]===arr[j].geneName){
              if(obj[uniqueGenes[i]]===undefined){
                obj[uniqueGenes[i]]= {
                  geneName: arr[j].geneName,
                  score: Number(arr[j].score),
                  total: Number(arr[i].score),
                  sources: 1
                }
              }
              else {
                obj[uniqueGenes[i]]= {
                  geneName: arr[j].geneName,
                  total: Number(obj[uniqueGenes[i]].total) + Number(arr[j].Score),
                  score: (Number(Number(obj[uniqueGenes[i]].score + Number(arr[j].score)))/(Number(obj[uniqueGenes[i]].sources) + 1)),
                  sources: Number(obj[uniqueGenes[i]].sources) + 1
                }
              }
            }
          }
        }

        var withAvgArr = Object.values(obj);
        return withAvgArr;
        // sortTheOrder(withAvgArr)
      },
      sortTheOrder(arr){
        arr.sort(function(a,b){
            if (a.sources===b.sources){
               return (b.score-a.score);
            } else if(a.sources<b.sources){
               return 1;
            } else if(a.sources>b.sources){
               return -1;
            }
         })
         for(var i=0; i<arr.length; i++){
           arr[i].rank = i+1;
         }
         return arr;
      },
      dataForPieChart(arr){
        var obj = {};
        for(var i=0; i<arr.length; i++){
          if(obj[arr[i].sources]===undefined){
            obj[arr[i].sources] = 1;
          }
          else {
            obj[arr[i].sources]++;
          }
        }
        var dataArray = [];
        var textToAppend = "Genes present in ";
        for (var data in obj){
          dataArray.push({
            name: textToAppend + data + " sources",
            count: obj[data]
          })
        }
        return dataArray;
      },
      createDictionaryOfSearches(){
        this.multipleSearchTerms.push(this.phenotypeTerm.value);
        var dictionaryObj = [];
        for(var i=0; i<this.multipleSearchTerms.length; i++){
          dictionaryObj.push({
            name: this.multipleSearchTerms[i],
            data: this.getPhenotypeData(this.multipleSearchTerms[i])
          })
        }
      },
      drawSvgBars: function(tempItems){
        var svgWidth = 800;
        //<stop offset="5%"  stop-color="#36D1DC"/>
        //<stop offset="95%" stop-color="#5B86E5"/>
        tempItems.map(function(gene){
          gene.htmlData = `<svg width="${svgWidth}" height="25" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="MyGradient">
                                    <stop offset="5%"  stop-color="#7CA8CF"/>
                                    <stop offset="95%" stop-color="#576E97"/>
                                </linearGradient>
                            </defs>

                            <rect fill="url(#MyGradient)"
                                  x="10" y="5" width="${gene.score * 800}" height="18"/>
                          </svg>`;
          gene.omimSrc = `https://www.ncbi.nlm.nih.gov/omim/?term=${gene.geneName}`;
          gene.medGenSrc = `https://www.ncbi.nlm.nih.gov/medgen/?term=${gene.geneName}`;
          gene.geneCardsSrc = `https://www.genecards.org/cgi-bin/carddisp.pl?gene=${gene.geneName}`;
          gene.ghrSrc = `https://ghr.nlm.nih.gov/gene/${gene.geneName}`;
        })
        // <text x="${gene.score * 400}" y="20" font-family="Verdana" font-size="14" fill="white">${gene.score}</text>

        //console.log(tempItems.slice(0,5));
        //self.items = tempItems;
        return tempItems
      },
      addSearchTermProperty: function(){
        this.tempItems.map(x=>{
          if(x["phenotypeSearchTerm"]===undefined){
            x["phenotypeSearchTerm"]=this.phenotypeTerm.value
          }
        });
      }
    }
  }
</script>

<style scoped>
  .centered
  {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo
  {
    max-width: 100%;
  }

  .link-btn
  {
    width: 150px;
  }
  .btnColor, .btn__content{
  color: white;
}
.btn{
  padding: 0px;
  height: 34px;
}
.form-control{
  font-size: 15px;
}


.headerWidth{
  width: 1%;
  color: red
}

#phenotype-term{
  width: 850px;
  height:35px;
  margin-top: 4px;
}

/* Media Queries */

@media screen and (max-width: 1050px){
  #phenotype-term{
    width: 800px;
    height:35px;
    margin-top: 4px;
  }
}

@media screen and (max-width: 950px){
  #phenotype-term{
    width: 600px;
    height:35px;
    margin-top: 4px;
  }
}


@media screen and (max-width: 700px){
  #phenotype-term{
    width: 400px;
    height:35px;
    margin-top: 4px;
  }
}
</style>
