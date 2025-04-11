using System;
using System.IO;
using Newtonsoft.Json;

namespace Hotfix
{
	class Program
	{
		static void Main(string[] args)
		{
			TestCase<listExample>("ExampleCategory.bytes");
			TestCase<listExample1>("Example1Category.bytes");
			TestCase<listArrayCase>("ArrayCaseCategory.bytes");
			TestCase<listTypeHighChecker>("TypeHighCheckerCategory.bytes");
			TestCase<listBoolTest>("BoolTestCategory.bytes");
		}

		private static void TestCase<_Type>(string fileName)
		{
			Console.WriteLine($"Start Test protubuf-net: {fileName}");
			FileStream fileStream = File.Open(Path.Combine(Environment.CurrentDirectory, "..", "..", "..", "..", "test", "exports", "proto2-data", fileName),
				FileMode.Open);
			var result = ProtoBuf.Serializer.Deserialize<_Type>(fileStream);
			Console.WriteLine("Read data:");
			Console.WriteLine(JsonConvert.SerializeObject(result));
		}
	}
}